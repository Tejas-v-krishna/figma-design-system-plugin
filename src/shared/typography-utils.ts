// Design System Kit - Typography & Scale Utilities
import {
  TypographyToken,
  SpacingToken,
  ShadowToken,
  BorderRadiusToken,
  StrokeToken,
  TypographyGroup,
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

export const SHADOW_SCALE = [
  { name: 'E0', x: 0, y: 1, blur: 2, spread: 0, color: 'rgba(0, 0, 0, 0.05)', inset: false },
  { name: 'E1', x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0, 0, 0, 0.1)', inset: false },
  { name: 'E2', x: 0, y: 4, blur: 8, spread: -1, color: 'rgba(0, 0, 0, 0.12)', inset: false },
  { name: 'E3', x: 0, y: 10, blur: 20, spread: -3, color: 'rgba(0, 0, 0, 0.15)', inset: false },
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

export const BORDER_STROKE_SCALE = [
  { name: '0', value: 1 },
  { name: '1', value: 2 },
  { name: '2', value: 4 },
  { name: '3', value: 6 },
];

export function generateSpacingTokens(baseUnit: number = 4): SpacingToken[] {
  return SPACING_SCALE.map((s) => ({
    name: s.name,
    value: s.value * (baseUnit / 4),
    rem: `${(s.value * (baseUnit / 4)) / 16}rem`,
  }));
}

export function generateShadowTokens(): ShadowToken[] {
  return SHADOW_SCALE.map((s) => ({
    name: s.name,
    value: `${s.inset ? 'inset ' : ''}${s.x}px ${s.y}px ${s.blur}px ${s.spread}px ${s.color}`,
    x: s.x,
    y: s.y,
    blur: s.blur,
    spread: s.spread,
    color: s.color,
  }));
}

export function generateBorderRadiusTokens(): BorderRadiusToken[] {
  return BORDER_RADIUS_SCALE.map((r) => ({
    name: r.name,
    value: r.value,
    px: r.px,
  }));
}

export function generateStrokeTokens(): StrokeToken[] {
  return BORDER_STROKE_SCALE.map((st) => ({
    name: st.name,
    value: st.value,
  }));
}

