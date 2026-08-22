import { hexToRgb, hexToHsl, hslToHex } from './color-utils';

/**
 * WCAG 2.1 contrast maths.
 *
 * Used in two places: the UI derives a legible chrome variant of the user's
 * brand colour from `clampLightness`, and the audit view flags token pairings
 * that would fail an accessibility review.
 */

export type WcagLevel = 'AAA' | 'AA' | 'AA Large' | 'Fail';

/**
 * Relative luminance per WCAG 2.1 §relativeluminancedef.
 *
 * The 0.03928 threshold and 2.4 exponent are the sRGB transfer function — this
 * is deliberately not a simple average of the channels, because human vision is
 * roughly six times more sensitive to green than to blue.
 */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Contrast ratio between two colours, from 1 (identical) to 21 (black on white).
 * Order of arguments doesn't matter.
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const light = Math.max(la, lb);
  const dark = Math.min(la, lb);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Grade a ratio against WCAG 2.1 AA/AAA for body or large text.
 *
 * "Large" is 18.66px bold or 24px regular and up. Anything under 3:1 fails
 * outright at any size.
 */
export function wcagLevel(ratio: number, large = false): WcagLevel {
  if (large) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3) return 'AA';
    return 'Fail';
  }
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

/**
 * Whichever of near-white / near-black is more readable on `hex`.
 *
 * Picking by measured contrast rather than by an HSL-lightness threshold matters
 * because HSL lightness is not perceived lightness. Both of this plugin's own
 * defaults break a naive `l < 50 ? white : dark` test:
 *
 *   #2563EB (primary) — HSL L 53, so naive picks dark text, but it measures
 *                       5.17:1 against white vs 3.44:1 against near-black.
 *   #10B981 (success) — HSL L 39, so naive picks white text, but it measures
 *                       2.54:1 against white vs 7.01:1 against near-black.
 *
 * Green carries ~6x the luminance weight of blue, which is exactly the effect
 * HSL discards and relative luminance keeps.
 */
export function bestTextOn(hex: string, light = '#ffffff', dark = '#16181c'): string {
  return contrastRatio(hex, light) >= contrastRatio(hex, dark) ? light : dark;
}

/**
 * Push a colour's HSL lightness into [min, max], leaving hue and saturation be.
 *
 * The UI needs this because the accent is user-supplied: a brand colour of
 * #0A0A0A or #FFFFFF would leave the rail's active marker and focus ring
 * invisible against the dark chrome. Clamping preserves the hue the user chose
 * while guaranteeing the marker is actually visible.
 */
export function clampLightness(hex: string, min: number, max: number): string {
  const { h, s, l } = hexToHsl(hex);
  const clamped = Math.min(max, Math.max(min, l));
  if (clamped === l) return hex;
  // A fully desaturated input has no hue to preserve, so lifting its lightness
  // just produces grey — which is the correct, legible answer.
  return hslToHex(h, s, clamped);
}

/**
 * Raise or lower a colour's lightness until it clears `target` contrast against
 * `against`, or give up and return the best attempt.
 *
 * Walks in 2% steps away from `against`'s luminance. Bounded at 64 iterations so
 * a target that's unreachable for a given hue (a saturated yellow can't hit 7:1
 * against white at any lightness) terminates instead of spinning.
 */
export function nudgeToContrast(hex: string, against: string, target: number): string {
  if (contrastRatio(hex, against) >= target) return hex;

  const { h, s, l } = hexToHsl(hex);
  const goDarker = relativeLuminance(against) > relativeLuminance(hex);
  const step = goDarker ? -2 : 2;

  let best = hex;
  let bestRatio = contrastRatio(hex, against);

  for (let i = 1; i <= 64; i++) {
    const nextL = l + step * i;
    if (nextL < 0 || nextL > 100) break;
    const candidate = hslToHex(h, s, nextL);
    const ratio = contrastRatio(candidate, against);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) return candidate;
  }

  return best;
}
