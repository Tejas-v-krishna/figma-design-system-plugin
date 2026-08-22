// Validation for a GenerationConfig arriving from outside this module.
//
// A config reaches the plugin sandbox from two places that TypeScript cannot
// vouch for: a postMessage payload from the UI iframe, and figma.clientStorage,
// which may hold a config written by an older build of the plugin. Both were
// previously cast straight to GenerationConfig, so a missing or wrong-typed
// field became a runtime surprise deep inside the generator — a NaN font size
// reaching figma.createText, an unknown radius preset producing `undefined` in
// a CSS variable, an array field that was actually a string.
//
// So the cast is replaced by this: every field is coerced against
// DEFAULT_CONFIG, out-of-range numbers are clamped, and unrecognised enum
// values fall back. Anything that had to be repaired is reported so the caller
// can surface it instead of swallowing it.
import {
  DEFAULT_CONFIG,
  EffectsIntensity,
  FontFamilies,
  GenerationConfig,
  GenerationOptions,
  RadiusPreset,
} from './types';

type TypographyScale = GenerationConfig['typographyScale'];

const RADIUS_PRESETS: readonly RadiusPreset[] = ['sharp', 'rounded', 'pill'];
const EFFECT_INTENSITIES: readonly EffectsIntensity[] = ['none', 'subtle', 'medium', 'strong'];
const TYPOGRAPHY_SCALES: readonly TypographyScale[] = ['material', 'system', 'custom'];

const HEX6 = /^#[0-9a-fA-F]{6}$/;

/** Bounds chosen so a repaired value is still usable, not merely non-crashing. */
const FONT_SIZE_RANGE = { min: 8, max: 32 } as const;
const SPACING_RANGE = { min: 1, max: 16 } as const;

export interface SanitizeResult {
  config: GenerationConfig;
  /** Human-readable note per field that had to be repaired. Empty when clean. */
  repairs: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Normalise a colour to `#RRGGBB`.
 *
 * A leading `#` is optional because the UI's hex field lets the user type
 * either form, and three-digit shorthand is expanded because imported token
 * files commonly use it.
 */
function normalizeHex(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const expanded =
    body.length === 3
      ? body
          .split('')
          .map((c) => c + c)
          .join('')
      : body;
  const candidate = `#${expanded}`;
  return HEX6.test(candidate) ? candidate.toUpperCase() : undefined;
}

export function createSanitizer(repairs: string[]) {
  const note = (field: string, why: string) => repairs.push(`${field}: ${why}`);

  return {
    text(value: unknown, fallback: string, field: string): string {
      if (typeof value === 'string' && value.trim()) return value.trim();
      if (value !== undefined) note(field, `expected text, using "${fallback}"`);
      return fallback;
    },

    hex(value: unknown, fallback: string, field: string): string {
      const parsed = normalizeHex(value);
      if (parsed) return parsed;
      if (value !== undefined) note(field, `"${String(value)}" is not a colour, using ${fallback}`);
      return fallback;
    },

    /** An absent optional colour stays absent; a malformed one is dropped, not defaulted. */
    optionalHex(value: unknown, field: string): string | undefined {
      if (value === undefined || value === null || value === '') return undefined;
      const parsed = normalizeHex(value);
      if (!parsed) note(field, `"${String(value)}" is not a colour, ignoring it`);
      return parsed;
    },

    number(value: unknown, fallback: number, range: { min: number; max: number }, field: string): number {
      const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
      if (!Number.isFinite(n)) {
        if (value !== undefined) note(field, `expected a number, using ${fallback}`);
        return fallback;
      }
      const clamped = Math.min(range.max, Math.max(range.min, n));
      if (clamped !== n) note(field, `${n} is out of range, clamped to ${clamped}`);
      return clamped;
    },

    oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T, field: string): T {
      if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return value as T;
      if (value !== undefined) note(field, `"${String(value)}" is not recognised, using "${fallback}"`);
      return fallback;
    },

    boolean(value: unknown, fallback: boolean, field: string): boolean {
      if (typeof value === 'boolean') return value;
      if (value !== undefined) note(field, `expected true or false, using ${String(fallback)}`);
      return fallback;
    },

    textList(value: unknown, field: string): string[] {
      if (value === undefined) return [];
      if (!Array.isArray(value)) {
        note(field, 'expected a list, ignoring it');
        return [];
      }
      const kept = value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
      if (kept.length !== value.length) note(field, `dropped ${value.length - kept.length} invalid entries`);
      return kept;
    },

    textMap(value: unknown, field: string): Record<string, string> | undefined {
      if (value === undefined) return undefined;
      if (!isRecord(value)) {
        note(field, 'expected a name map, ignoring it');
        return undefined;
      }
      const out: Record<string, string> = {};
      for (const [key, entry] of Object.entries(value)) {
        if (typeof entry === 'string' && entry) out[key] = entry;
      }
      return Object.keys(out).length > 0 ? out : undefined;
    },
  };
}

function sanitizeFonts(value: unknown, repairs: string[]): FontFamilies {
  const s = createSanitizer(repairs);
  const raw = isRecord(value) ? value : {};
  if (value !== undefined && !isRecord(value)) repairs.push('fontFamily: expected an object, using defaults');
  return {
    heading: s.text(raw.heading, DEFAULT_CONFIG.fontFamily.heading, 'fontFamily.heading'),
    body: s.text(raw.body, DEFAULT_CONFIG.fontFamily.body, 'fontFamily.body'),
    mono: s.text(raw.mono, DEFAULT_CONFIG.fontFamily.mono, 'fontFamily.mono'),
  };
}

function sanitizeOptions(value: unknown, repairs: string[]): GenerationOptions {
  const s = createSanitizer(repairs);
  const raw = isRecord(value) ? value : {};
  if (value !== undefined && !isRecord(value)) repairs.push('options: expected an object, using defaults');
  const d = DEFAULT_CONFIG.options;
  return {
    includeDarkMode: s.boolean(raw.includeDarkMode, d.includeDarkMode, 'options.includeDarkMode'),
    includeVariants: s.boolean(raw.includeVariants, d.includeVariants, 'options.includeVariants'),
    includeStates: s.boolean(raw.includeStates, d.includeStates, 'options.includeStates'),
    createStyles: s.boolean(raw.createStyles, d.createStyles, 'options.createStyles'),
    createVariables: s.boolean(raw.createVariables, d.createVariables, 'options.createVariables'),
    organizePages: s.boolean(raw.organizePages, d.organizePages, 'options.organizePages'),
    generateFullVariantSets: s.boolean(
      raw.generateFullVariantSets,
      d.generateFullVariantSets,
      'options.generateFullVariantSets'
    ),
  };
}

/**
 * Coerce an untrusted value into a usable GenerationConfig.
 *
 * Never throws and never returns a partial config: the worst case is
 * DEFAULT_CONFIG with every repair listed. That is deliberate — a design system
 * built from defaults is recoverable, whereas a generator that aborts halfway
 * leaves a half-populated Figma file the user has to clean up by hand.
 */
export function sanitizeConfig(input: unknown): SanitizeResult {
  const repairs: string[] = [];
  const s = createSanitizer(repairs);

  if (!isRecord(input)) {
    return {
      config: { ...DEFAULT_CONFIG, fontFamily: { ...DEFAULT_CONFIG.fontFamily }, options: { ...DEFAULT_CONFIG.options } },
      repairs: input === undefined ? [] : ['config: not an object, using defaults'],
    };
  }

  const config: GenerationConfig = {
    brandName: s.text(input.brandName, DEFAULT_CONFIG.brandName, 'brandName'),
    primaryColor: s.hex(input.primaryColor, DEFAULT_CONFIG.primaryColor, 'primaryColor'),
    secondaryColor: s.optionalHex(input.secondaryColor, 'secondaryColor'),
    successColor: s.optionalHex(input.successColor, 'successColor'),
    errorColor: s.optionalHex(input.errorColor, 'errorColor'),
    warningColor: s.optionalHex(input.warningColor, 'warningColor'),
    informationColor: s.optionalHex(input.informationColor, 'informationColor'),
    neutralColor: s.optionalHex(input.neutralColor, 'neutralColor'),
    accentColor: s.optionalHex(input.accentColor, 'accentColor'),
    colorNames: s.textMap(input.colorNames, 'colorNames'),
    fontFamily: sanitizeFonts(input.fontFamily, repairs),
    typographyScale: s.oneOf(
      input.typographyScale,
      TYPOGRAPHY_SCALES,
      DEFAULT_CONFIG.typographyScale,
      'typographyScale'
    ),
    baseFontSize: s.number(input.baseFontSize, DEFAULT_CONFIG.baseFontSize, FONT_SIZE_RANGE, 'baseFontSize'),
    baseSpacing: s.number(input.baseSpacing, DEFAULT_CONFIG.baseSpacing, SPACING_RANGE, 'baseSpacing'),
    radiusPreset: s.oneOf(input.radiusPreset, RADIUS_PRESETS, DEFAULT_CONFIG.radiusPreset, 'radiusPreset'),
    effectsIntensity: s.oneOf(
      input.effectsIntensity,
      EFFECT_INTENSITIES,
      DEFAULT_CONFIG.effectsIntensity,
      'effectsIntensity'
    ),
    // An empty list is the "generate everything" sentinel, so it is not a repair.
    componentsToGenerate: s.textList(input.componentsToGenerate, 'componentsToGenerate'),
    options: sanitizeOptions(input.options, repairs),
  };

  return { config, repairs };
}
