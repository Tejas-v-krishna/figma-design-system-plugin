import { useEffect } from 'react';
import { GenerationConfig } from '../shared/types';
import { hexToRgb } from '../shared/color-utils';
import { bestTextOn, clampLightness, nudgeToContrast } from '../shared/contrast';

/**
 * Paints the panel in the user's own system.
 *
 * There is no fixed accent colour in this UI. The brand colour being configured
 * drives the rail marker, focus rings, selection and the build button; the chosen
 * radius sets the panel's own corners; the chosen heading face sets the specimen
 * headings. See docs/DESIGN.md — "the tool wears your system".
 */

const INK = '#14161a';

// The chosen radius preset, applied to the panel's own controls. Not a literal
// copy of the token value: a 9999px pill would swallow a 26px swatch button, so
// 'pill' reads as "as round as a control this size can be".
const RADIUS_BY_PRESET: Record<GenerationConfig['radiusPreset'], string> = {
  sharp: '2px',
  rounded: '8px',
  pill: '14px',
};

function rgbaFrom(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  const to255 = (c: number) => Math.round(c * 255);
  return `rgba(${to255(r)}, ${to255(g)}, ${to255(b)}, ${alpha})`;
}

/**
 * Resolve a brand hex to the four variables the chrome needs.
 *
 * Exported separately from the hook so it can be tested without a DOM.
 */
export function deriveBrandVars(brandHex: string): Record<string, string> {
  // --brand-chrome is the variant used anywhere the brand meets the dark
  // instrument: the rail's active marker and its focus rings. A brand colour of
  // #0A0A0A or #FFFFFF would otherwise be invisible there, so lightness is
  // clamped into a legible band and then nudged until it actually clears 3:1
  // against the rail. Hue and saturation are preserved throughout, so it still
  // reads as the user's colour.
  const chromeBase = clampLightness(brandHex, 45, 82);
  const chrome = nudgeToContrast(chromeBase, INK, 3);

  return {
    '--brand': brandHex,
    '--brand-chrome': chrome,
    '--brand-ink': bestTextOn(brandHex),
    '--brand-wash': rgbaFrom(brandHex, 0.1),
  };
}

function isValidHex(value: string | undefined): value is string {
  return typeof value === 'string' && /^#?[0-9a-fA-F]{6}$/.test(value.trim());
}

export function useBrandTheme(config: GenerationConfig): void {
  const brand = config.primaryColor;
  const radius = config.radiusPreset;
  const heading = config.fontFamily.heading;

  useEffect(() => {
    const root = document.documentElement;

    // The hex field is a free-text input, so it spends most of its life
    // mid-edit and invalid ("#25", "#2563E"). Skipping those keeps the whole
    // panel from strobing between colours on every keystroke — the last valid
    // value stays applied until the next one parses.
    if (isValidHex(brand)) {
      const normalized = brand.trim().startsWith('#') ? brand.trim() : `#${brand.trim()}`;
      for (const [prop, value] of Object.entries(deriveBrandVars(normalized))) {
        root.style.setProperty(prop, value);
      }
    }

    root.style.setProperty('--radius-user', RADIUS_BY_PRESET[radius] ?? '8px');

    // Quoted so a family with spaces stays one token, with the UI stack behind
    // it: the panel can't load webfonts, so a face the host OS lacks has to fall
    // through to something rather than to the browser default serif.
    root.style.setProperty(
      '--font-specimen',
      heading ? `"${heading}", var(--font-ui)` : 'var(--font-ui)'
    );
  }, [brand, radius, heading]);
}
