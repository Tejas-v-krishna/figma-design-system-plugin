// Design System Kit - Typography & Scale Utilities
import {
  TypographyToken,
  SpacingToken,
  ShadowToken,
  BorderRadiusToken,
  StrokeToken,
  TypographyGroup,
  EffectsIntensity,
  RadiusPreset,
} from './types';

export interface TypographyScaleEntry {
  name: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
}

// Blueprint typography: Inter, slash-named, line-height = size × 1.2
// rounded to the nearest multiple of 4. Headings are Semi-bold; each
// Body size ships Default / Semi Bold / Link variants.
type BpVariant = 'default' | 'semi-bold' | 'link';

interface BlueprintEntry {
  name: string; // e.g. "Headings / H1", "Body / Medium"
  group: TypographyGroup;
  size: number;
  weight: number;
  variants: BpVariant[];
}

const BLUEPRINT_TYPE: BlueprintEntry[] = [
  { name: 'Headings / H1', group: 'headings', size: 60, weight: 600, variants: ['default'] },
  { name: 'Headings / H2', group: 'headings', size: 48, weight: 600, variants: ['default'] },
  { name: 'Headings / H3', group: 'headings', size: 40, weight: 600, variants: ['default'] },
  { name: 'Headings / H4', group: 'headings', size: 32, weight: 600, variants: ['default'] },
  { name: 'Headings / H5', group: 'headings', size: 24, weight: 600, variants: ['default'] },
  { name: 'Headings / H6', group: 'headings', size: 20, weight: 600, variants: ['default'] },
  { name: 'Body / Large', group: 'body', size: 20, weight: 400, variants: ['default', 'semi-bold', 'link'] },
  { name: 'Body / Medium', group: 'body', size: 16, weight: 400, variants: ['default', 'semi-bold', 'link'] },
  { name: 'Body / Small', group: 'body', size: 14, weight: 400, variants: ['default', 'semi-bold', 'link'] },
  { name: 'Body / X-Small', group: 'body', size: 12, weight: 400, variants: ['default', 'semi-bold', 'link'] },
];

/** Round `v` to the nearest multiple of `step` (blueprint: 4). */
function roundToNearest(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export function generateTypographyTokens(
  fontFamily: string,
  baseSize: number = 16,
  scale: 'material' | 'system' | 'custom' = 'material'
): TypographyToken[] {
  // 'custom' scales the body sizes from the chosen base; material/system
  // use the fixed blueprint sizes.
  const factor = scale === 'custom' ? baseSize / 16 : 1;
  const tokens: TypographyToken[] = [];
  for (const e of BLUEPRINT_TYPE) {
    const size = Math.round(e.size * factor);
    for (const v of e.variants) {
      const label = v === 'default' ? '' : v === 'semi-bold' ? ' / Semi Bold' : ' / Link';
      tokens.push({
        name: `${e.name}${label}`,
        group: e.group,
        fontFamily,
        fontSize: size,
        fontWeight: v === 'semi-bold' ? 600 : e.weight,
        lineHeight: roundToNearest(size * 1.2, 4),
        letterSpacing: 0,
        underline: v === 'link',
      });
    }
  }
  return tokens;
}

// Blueprint 4-point math scale: 1,2,4,8,12,16,20,24,28,32,64 px.
export const SPACING_SCALE = [
  { name: '25', value: 1 },
  { name: '50', value: 2 },
  { name: '100', value: 4 },
  { name: '200', value: 8 },
  { name: '300', value: 12 },
  { name: '400', value: 16 },
  { name: '500', value: 20 },
  { name: '600', value: 24 },
  { name: '700', value: 28 },
  { name: '800', value: 32 },
  { name: '1100', value: 64 },
];

/**
 * Semantic step names, matching the radius scale below and the names the
 * component templates ask for. Was `E0`–`E3`, which no call site used: all
 * seven asked shadow() for xs/md/lg/xl, got undefined, and setEffect no-ops on
 * undefined — so not one generated component has ever carried a shadow. Six of
 * those sites wrote `shadow(ctx.tokens, 'md')!`, and the non-null assertion is
 * what kept the type checker quiet about it.
 *
 * `xl` is new; the old scale stopped at four steps while the templates wanted a
 * fifth for modals and dialogs.
 *
 * Alpha is a number rather than baked into a colour string so intensity can
 * scale it. The first four steps' geometry and alpha are unchanged, so `medium`
 * still emits exactly what E0–E3 did.
 */
export const SHADOW_SCALE = [
  { name: 'xs', x: 0, y: 1, blur: 2, spread: 0, alpha: 0.05, inset: false },
  { name: 'sm', x: 0, y: 2, blur: 4, spread: 0, alpha: 0.1, inset: false },
  { name: 'md', x: 0, y: 4, blur: 8, spread: -1, alpha: 0.12, inset: false },
  { name: 'lg', x: 0, y: 10, blur: 20, spread: -3, alpha: 0.15, inset: false },
  { name: 'xl', x: 0, y: 20, blur: 40, spread: -8, alpha: 0.18, inset: false },
];

/**
 * Semantic step names, not ordinals.
 *
 * This scale used to be named `none,1,2,3,4,5,6,7`, while all 39 call sites in
 * the component templates asked for `sm`/`md`/`lg`/`xl`. None of those names
 * existed, so radiusPx returned its hardcoded 8px fallback every time and the
 * radius scale never reached a single generated component. Names now match
 * what the templates — and every other design system a user has seen — use.
 *
 * `md` is 8px so the components that were silently getting the 8px fallback
 * keep the corners they had. The steps are geometric rather than the old
 * near-linear 2,4,6,8,10,12,16: a radius scale with both 6 and 10 in it offers
 * a choice nobody can see. `full` replaces the 9999 that templates hardcoded
 * for the pill preset.
 */
export const BORDER_RADIUS_SCALE = [
  { name: 'none', value: '0px', px: 0 },
  { name: 'xs', value: '2px', px: 2 },
  { name: 'sm', value: '4px', px: 4 },
  { name: 'md', value: '8px', px: 8 },
  { name: 'lg', value: '12px', px: 12 },
  { name: 'xl', value: '16px', px: 16 },
  { name: '2xl', value: '24px', px: 24 },
  { name: 'full', value: '9999px', px: 9999 },
];

/**
 * Named for the width each step is, not for its position in the list.
 *
 * These were `0,1,2,3` against values `1,2,4,6`, so every name was off by one
 * from the thing it named: `--stroke-0` was a 1px border and `--stroke-3` was
 * 6px. A four-entry scale where the label contradicts the value is a scale
 * people will misuse, and unlike the radius and shadow scales nothing looks
 * these up by name — they are only ever iterated — so the names existed purely
 * to be read by a user, and were wrong for that one job.
 *
 * Value-named rather than xs/sm/md/lg because a border width has no semantics
 * beyond its width; this is the convention Tailwind and Polaris both use.
 */
export const BORDER_STROKE_SCALE = [
  { name: '1', value: 1 },
  { name: '2', value: 2 },
  { name: '4', value: 4 },
  { name: '6', value: 6 },
];

export function generateSpacingTokens(baseUnit: number = 4): SpacingToken[] {
  return SPACING_SCALE.map((s) => ({
    name: s.name,
    value: s.value * (baseUnit / 4),
    rem: `${(s.value * (baseUnit / 4)) / 16}rem`,
  }));
}

/**
 * How each intensity bends the ramp: geometry (y, blur, spread) and alpha.
 *
 * Intensity used to *remove* steps — subtle kept the first two names, medium
 * the first four, strong all of them. Two things were wrong with that. It made
 * intensity a length control rather than a strength control, so `medium` and
 * `strong` both meant "all four steps" and produced byte-identical output. And
 * it deleted names out from under the component templates, which ask for a step
 * by name: at `subtle`, every template requesting `md` or `lg` silently lost
 * its shadow.
 *
 * Scaling instead means every name resolves at every intensity, and the knob
 * does what it says. `medium` is identity, so the default output is unchanged.
 */
const SHADOW_INTENSITY: Record<EffectsIntensity, { geometry: number; alpha: number } | null> = {
  // Not an empty ramp of zeroed shadows: "none" means the design system has no
  // elevation tokens, so there is nothing to export or apply.
  none: null,
  subtle: { geometry: 0.6, alpha: 0.7 },
  medium: { geometry: 1, alpha: 1 },
  strong: { geometry: 1.5, alpha: 1.3 },
};

export function generateShadowTokens(intensity: EffectsIntensity = 'medium'): ShadowToken[] {
  const mul = SHADOW_INTENSITY[intensity];
  if (!mul) return [];
  return SHADOW_SCALE.map((s) => {
    // Offsets round to whole pixels because that is what Figma's effect panel
    // shows and what a hand-written CSS shadow looks like. Alpha keeps three
    // decimals: 0.05 x 0.7 is 0.035, and rounding that to two would drop the
    // subtlest step to 0.04, a 14% jump.
    const y = Math.round(s.y * mul.geometry);
    const blur = Math.round(s.blur * mul.geometry);
    const spread = Math.round(s.spread * mul.geometry);
    // Capped below 1 so `strong` on a future high-alpha step stays a shadow
    // rather than a solid black slab.
    const alpha = Math.round(Math.min(s.alpha * mul.alpha, 0.9) * 1000) / 1000;
    const color = `rgba(0, 0, 0, ${alpha})`;
    return {
      name: s.name,
      value: `${s.inset ? 'inset ' : ''}${s.x}px ${y}px ${blur}px ${spread}px ${color}`,
      x: s.x,
      y,
      blur,
      spread,
      color,
      alpha,
    };
  });
}

/**
 * The radius scale as the chosen preset leaves it.
 *
 * Lives here rather than inside buildTokens because the panel needs the same
 * answer: its Radius list has to show the values a build will actually produce,
 * and a second copy of this arithmetic in the UI is a second thing to get wrong.
 *
 * `none` and `full` are fixed points. A preset that rewrote `none` would leave
 * the system with no way to say "no corner", and one that rewrote `full` would
 * take away the pill the templates ask for by name.
 */
export function generateBorderRadiusTokens(preset: RadiusPreset = 'rounded'): BorderRadiusToken[] {
  return BORDER_RADIUS_SCALE.map((r) => {
    if (preset === 'rounded' || r.name === 'none' || r.name === 'full') {
      return { name: r.name, value: r.value, px: r.px };
    }
    const px = preset === 'sharp' ? 0 : 9999;
    return { name: r.name, value: `${px}px`, px };
  });
}

export function generateStrokeTokens(): StrokeToken[] {
  return BORDER_STROKE_SCALE.map((st) => ({
    name: st.name,
    value: st.value,
  }));
}

