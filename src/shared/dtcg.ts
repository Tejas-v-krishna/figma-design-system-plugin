// W3C Design Tokens Community Group format serializer.
//
// Targets the 2025.10 draft (https://www.designtokens.org/TR/drafts/format/),
// which is a real break from the shape this exporter used to emit. The previous
// output was DTCG-flavoured JSON rather than DTCG:
//
//   - `$type: "borderRadius"` is not a type in any draft of the spec. A corner
//     radius is a `dimension`.
//   - `shadow` was a CSS string. The spec defines it as a composite object with
//     separate colour, offsets, blur and spread, precisely so a consumer that is
//     not CSS (iOS, Android, Flutter) can read it.
//   - `dimension` was a string like "16px". The spec requires
//     `{ "value": 16, "unit": "px" }`, and requires the unit even at zero.
//   - `color` was a hex string. The spec requires
//     `{ "colorSpace": "srgb", "components": [r, g, b] }`. `hex` and `alpha` are
//     kept alongside, as the spec's own examples do, so the file stays readable
//     and works with consumers that only know how to look for a hex.
//   - Typography was absent entirely, so a format whose selling point is being
//     complete shipped without a single font size in it.
//   - Nothing was aliased. Every value was concrete, which throws away the one
//     thing the format has that a flat dump of CSS variables does not: a
//     `{color.primary.500}` reference that survives the export, so a consumer
//     can see that a button's background *is* the primary colour rather than
//     that it happens to be #2563EB today.
//
// `$type` is declared once per group and inherited, rather than repeated on all
// ~200 leaves. That is idiomatic spec usage and it keeps the file legible.
import {
  ColorShades,
  ColorToken,
  DesignTokens,
  GenerationConfig,
  ShadowToken,
  TypographyToken,
} from './types';
import { hexToRgb } from './color-utils';
import { SEMANTIC_DEFS, COMPONENT_DEFS, ColorRef } from './semantic-defs';

const DTCG_SCHEMA = 'https://www.designtokens.org/schemas/2025.10/format.json';

// ---------------------------------------------------------------------------
// Leaf value shapes, straight from the spec.
// ---------------------------------------------------------------------------

export interface DtcgDimension {
  value: number;
  unit: 'px' | 'rem';
}

export interface DtcgColorValue {
  colorSpace: 'srgb';
  components: [number, number, number];
  alpha: number;
  hex: string;
}

export interface DtcgShadowValue {
  color: DtcgColorValue;
  offsetX: DtcgDimension;
  offsetY: DtcgDimension;
  blur: DtcgDimension;
  spread: DtcgDimension;
  inset: boolean;
}

export interface DtcgTypographyValue {
  fontFamily: string[];
  fontSize: DtcgDimension;
  fontWeight: number;
  letterSpacing: DtcgDimension;
  lineHeight: number;
}

/** A `{group.token}` reference. Any leaf may carry one instead of a literal. */
type DtcgAlias = string;

export type DtcgValue =
  | DtcgColorValue
  | DtcgDimension
  | DtcgShadowValue
  | DtcgTypographyValue
  | string[]
  | DtcgAlias;

export type DtcgTokenType = 'color' | 'dimension' | 'shadow' | 'typography' | 'fontFamily';

export interface DtcgToken {
  $value: DtcgValue;
  $type?: DtcgTokenType;
  $description?: string;
}

/**
 * A group. `$type` and `$description` are reserved keys; everything else is a
 * child token or child group.
 *
 * Typed with a union member per reserved key rather than as
 * `Record<string, DtcgToken | DtcgGroup>` because the two reserved keys hold
 * strings, and a `Record` that admitted them would make every child lookup
 * possibly-a-string for the rest of the file.
 */
export interface DtcgGroup {
  [key: string]: DtcgToken | DtcgGroup | DtcgTokenType | string | undefined;
  $type?: DtcgTokenType;
  $description?: string;
}

// ---------------------------------------------------------------------------
// Value constructors
// ---------------------------------------------------------------------------

/** A pixel dimension. The unit is required even at zero — see the spec. */
function px(value: number): DtcgDimension {
  return { value, unit: 'px' };
}

/** Four decimals: enough to round-trip an 8-bit channel, short enough to read. */
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function dtcgColor(hex: string, alpha = 1): DtcgColorValue {
  const { r, g, b } = hexToRgb(hex);
  return {
    colorSpace: 'srgb',
    components: [round4(r), round4(g), round4(b)],
    alpha,
    // Lower-cased so two tokens holding the same colour are byte-identical
    // regardless of how the user typed it into the panel.
    hex: hex.toLowerCase(),
  };
}

/**
 * A DTCG key: lower-case, dash-separated, no dots.
 *
 * Dots are the spec's reference delimiter, so a key containing one would make
 * `{a.b.c}` ambiguous. Slashes come from the Figma-style paths the alias tables
 * use ("Primary/Hover"), and collapse to dashes rather than nesting — see the
 * note on the semantic tier below for why.
 */
function key(name: string): string {
  return name
    .replace(/\./g, '')
    .split(/[/\s]+/)
    .filter(Boolean)
    .map((part) =>
      part
        // Split camel and Pascal runs so "SubtleText" reads as "subtle-text".
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .toLowerCase()
    )
    .join('-')
    .replace(/-+/g, '-');
}

// ---------------------------------------------------------------------------
// Tier 1 — primitives
// ---------------------------------------------------------------------------

function shadeGroup(shades: ColorShades): DtcgGroup {
  const group: DtcgGroup = {};
  for (const [shade, hex] of Object.entries(shades)) {
    group[shade] = { $value: dtcgColor(hex) };
  }
  return group;
}

function colorTier(colors: Record<string, ColorToken>): DtcgGroup {
  const group: DtcgGroup = {
    $type: 'color',
    $description:
      'Tier 1 — primitives. Raw values, one per shade. Nothing in a product should reference these directly; use the semantic tier.',
  };
  for (const [name, ct] of Object.entries(colors)) {
    const ramp = shadeGroup(ct.shades);
    if (ct.darkShades) {
      // The mechanical mirror of the light ramp (50<->950), which is what the CSS
      // and Tailwind exports emit under prefers-color-scheme: dark. Kept here so
      // the four formats agree. It is a different strategy from the semantic
      // tier's dark subgroup, which picks a shade per role rather than mirroring
      // — that one is the better answer, and the $description says so.
      ramp.dark = {
        $description: 'The light ramp mirrored across 500. Shade-for-shade dark theming.',
        ...shadeGroup(ct.darkShades),
      };
    }
    group[key(name)] = ramp;
  }
  // Anchors, not ramp entries: there is one white and one black, and giving
  // either a shade would be a lie about it. The semantic tier references these
  // for text-on-colour and default surfaces, exactly as the Figma variable tier
  // does.
  group.white = { $value: dtcgColor('#FFFFFF') };
  group.black = { $value: dtcgColor('#000000') };
  return group;
}

// ---------------------------------------------------------------------------
// Tier 2 — semantic
// ---------------------------------------------------------------------------

/** `{color.primary.500}` for a ramp entry, `{color.white}` for an anchor. */
function primitiveAlias(ref: ColorRef): string {
  const [name, shade] = ref;
  if (name === 'white' || name === 'black') return `{color.${name}}`;
  return `{color.${key(name)}.${shade}}`;
}

/**
 * Tier 2, split into `light` and `dark` subgroups.
 *
 * Flat keys inside each subgroup — `primary-hover`, not `primary.hover` —
 * because the alias table defines both `Primary` and `Primary/Hover`, and the
 * spec does not let one name be a token and a group at once. Five role families
 * have that shape (primary, success, warning, error, info), so nesting is not an
 * option here rather than a preference.
 *
 * `light` is emitted even when dark mode is off, so a consumer's path never
 * changes based on a toggle it cannot see.
 */
function semanticTier(includeDark: boolean): DtcgGroup {
  const light: DtcgGroup = {};
  const dark: DtcgGroup = {};
  for (const d of SEMANTIC_DEFS) {
    const k = key(d.name);
    light[k] = { $value: primitiveAlias(d.light) };
    if (includeDark) dark[k] = { $value: primitiveAlias(d.dark ?? d.light) };
  }
  const group: DtcgGroup = {
    $type: 'color',
    $description:
      'Tier 2 — roles. Every value is a reference to a primitive, so re-pointing one role re-themes everything that uses it. This is the tier a product should consume.',
    light,
  };
  if (includeDark) group.dark = dark;
  return group;
}

// ---------------------------------------------------------------------------
// Tier 3 — component
// ---------------------------------------------------------------------------

/**
 * Tier 3, nested one level by component.
 *
 * `Button/Background/Default` becomes `component.light.button.background-default`:
 * the first path segment is a real grouping (all the button slots belong
 * together) while the rest is flattened, for the same token-cannot-be-a-group
 * reason as the semantic tier.
 */
function componentTier(includeDark: boolean): DtcgGroup {
  const build = (mode: 'light' | 'dark'): DtcgGroup => {
    const out: DtcgGroup = {};
    for (const d of COMPONENT_DEFS) {
      const [head = d.name, ...rest] = d.name.split('/');
      const owner = key(head);
      const existing = out[owner];
      const bucket: DtcgGroup =
        existing && typeof existing === 'object' && !('$value' in existing)
          ? (existing as DtcgGroup)
          : {};
      bucket[key(rest.join('/'))] = { $value: `{semantic.${mode}.${key(d.semantic)}}` };
      out[owner] = bucket;
    }
    return out;
  };
  const group: DtcgGroup = {
    $type: 'color',
    $description:
      'Tier 3 — component slots. Every value references a role in tier 2, never a primitive.',
    light: build('light'),
  };
  if (includeDark) group.dark = build('dark');
  return group;
}

// ---------------------------------------------------------------------------
// Non-colour tiers
// ---------------------------------------------------------------------------

function shadowValue(s: ShadowToken): DtcgShadowValue {
  return {
    // Every step is black at a varying opacity, so the colour is inline rather
    // than a reference — there is no token for "black at 12%".
    color: dtcgColor('#000000', s.alpha),
    offsetX: px(s.x),
    offsetY: px(s.y),
    blur: px(s.blur),
    spread: px(s.spread),
    inset: false,
  };
}

/**
 * Typography, nested by the group the token already declares.
 *
 * `Body / Medium` and `Body / Medium / Semi Bold` both exist, so the leaf under
 * `body` has to be flat (`medium`, `medium-semi-bold`) for the usual reason.
 *
 * `lineHeight` is a unitless multiple, which is what the spec requires and not
 * what these tokens store — they hold a pixel height, snapped to a 4px grid.
 * Dividing recovers the ratio, which is why `body-small` reports 1.143 rather
 * than the 1.2 the generator started from: 14 x 1.2 is 16.8, and the grid takes
 * it to 16.
 */
function typographyTier(tokens: TypographyToken[]): DtcgGroup {
  const group: DtcgGroup = {
    $type: 'typography',
    $description: 'Composite type styles. fontFamily is an array so it doubles as a CSS stack.',
  };
  for (const t of tokens) {
    const [head = t.name, ...rest] = t.name.split('/').map((p) => p.trim());
    const owner = key(head);
    const existing = group[owner];
    const bucket: DtcgGroup =
      existing && typeof existing === 'object' && !('$value' in existing)
        ? (existing as DtcgGroup)
        : {};
    const value: DtcgTypographyValue = {
      fontFamily: [t.fontFamily, 'sans-serif'],
      fontSize: px(t.fontSize),
      fontWeight: t.fontWeight,
      letterSpacing: px(t.letterSpacing),
      lineHeight: t.fontSize > 0 ? Math.round((t.lineHeight / t.fontSize) * 1000) / 1000 : 1,
    };
    const leaf: DtcgToken = { $value: value };
    // The spec has no textDecoration in the typography composite, so an
    // underline would be silently dropped. Said out loud instead.
    if (t.underline) leaf.$description = 'Underlined.';
    bucket[key(rest.join('/'))] = leaf;
    group[owner] = bucket;
  }
  return group;
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export function buildDtcgDocument(tokens: DesignTokens, config: GenerationConfig): DtcgGroup {
  const includeDark = config.options.includeDarkMode;

  const dimension: DtcgGroup = { $type: 'dimension' };
  for (const s of tokens.spacing) dimension[`spacing-${key(s.name)}`] = { $value: px(s.value) };

  const borderRadius: DtcgGroup = {
    // dimension, not "borderRadius" — that was never a type the spec defines.
    $type: 'dimension',
    $description: 'Corner radii. `full` is a large pixel value rather than a keyword, per the spec.',
  };
  for (const r of tokens.borderRadius) borderRadius[key(r.name)] = { $value: px(r.px) };

  const strokeWidth: DtcgGroup = { $type: 'dimension' };
  for (const s of tokens.strokes) strokeWidth[key(s.name)] = { $value: px(s.value) };

  const shadow: DtcgGroup = { $type: 'shadow' };
  for (const s of tokens.shadows) shadow[key(s.name)] = { $value: shadowValue(s) };

  const fontFamily: DtcgGroup = {
    $type: 'fontFamily',
    heading: { $value: [config.fontFamily.heading, 'sans-serif'] },
    body: { $value: [config.fontFamily.body, 'sans-serif'] },
    mono: { $value: [config.fontFamily.mono, 'monospace'] },
  };

  const doc: DtcgGroup = {
    $schema: DTCG_SCHEMA,
    $description: `${config.brandName} — generated by Design System Kit.`,
    color: colorTier(tokens.colors as unknown as Record<string, ColorToken>),
    semantic: semanticTier(includeDark),
    component: componentTier(includeDark),
    fontFamily,
    typography: typographyTier(tokens.typography),
    dimension,
    borderRadius,
    strokeWidth,
  };
  // An empty group is not useful and, at effectsIntensity "none", would claim the
  // system has an elevation scale when the whole point is that it does not.
  if (tokens.shadows.length) doc.shadow = shadow;
  return doc;
}

export function toDtcg(tokens: DesignTokens, config: GenerationConfig): string {
  return JSON.stringify(buildDtcgDocument(tokens, config), null, 2);
}
