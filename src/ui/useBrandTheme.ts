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

const RAIL_SURFACE = '#F7F7F6';

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
  // On a light rail, dark brands must clamp down (20..62) and nudge to 4.5:1
  // contrast so the brand tick and focus rings remain distinct on light chrome.
  const chromeBase = clampLightness(brandHex, 20, 62);
  const chrome = nudgeToContrast(chromeBase, RAIL_SURFACE, 4.5);

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

    // No fallback: the map is keyed by the RadiusPreset union, so every value
    // the type admits has an entry, and sanitizeConfig guarantees a stored
    // config can't smuggle in a fourth preset.
    root.style.setProperty('--radius-user', RADIUS_BY_PRESET[radius]);

    // Quoted so a family with spaces stays one token, with the UI stack behind
    // it: the panel can't load webfonts, so a face the host OS lacks has to fall
    // through to something rather than to the browser default serif.
    root.style.setProperty(
      '--font-specimen',
      heading ? `"${heading}", var(--font-ui)` : 'var(--font-ui)'
    );
  }, [brand, radius, heading]);
}
