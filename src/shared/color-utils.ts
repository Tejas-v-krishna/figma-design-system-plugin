// Design System Kit - Color Utilities
import { ColorToken, ColorShades, HSLColor } from './types';

export function hexToHsl(hex: string): HSLColor {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  const g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  const b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: clamp(Math.round(h * 360), 0, 360),
    s: clamp(Math.round(s * 100), 0, 100),
    l: clamp(Math.round(l * 100), 0, 100),
  };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(255 * x).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Overlay `base` onto `bg` at the given alpha (0..1) per channel and return
 * the resulting solid hex. Used to derive tint/shade ramps by overlaying the 500
 * base onto white (lighter) or black (darker).
 */
export function overlayHex(base: string, bg: string, alpha: number): string {
  const b = hexToRgb(base);
  const g = hexToRgb(bg);
  const mix = (cb: number, cg: number) =>
    Math.round((cb * alpha + cg * (1 - alpha)) * 255);
  const toHex = (x: number) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0');
  return `#${toHex(mix(b.r, g.r))}${toHex(mix(b.g, g.g))}${toHex(mix(b.b, g.b))}`;
}

/**
 * Blueprint color scale: roots sit at 500; lighter shades (50–400) overlay the
 * 500 base on pure white at 10/20/40/60/80% opacity, darker shades (600–950)
 * overlay on pure black at 80/60/40/20/10%. No odd numbers.
 */
export function generateColorShades(baseHex: string): ColorShades {
  const white = '#FFFFFF';
  const black = '#000000';
  const shades = {} as ColorShades;
  shades[50] = overlayHex(baseHex, white, 0.1);
  shades[100] = overlayHex(baseHex, white, 0.2);
  shades[200] = overlayHex(baseHex, white, 0.4);
  shades[300] = overlayHex(baseHex, white, 0.6);
  shades[400] = overlayHex(baseHex, white, 0.8);
  shades[500] = baseHex;
  shades[600] = overlayHex(baseHex, black, 0.8);
  shades[700] = overlayHex(baseHex, black, 0.6);
  shades[800] = overlayHex(baseHex, black, 0.4);
  shades[900] = overlayHex(baseHex, black, 0.2);
  shades[950] = overlayHex(baseHex, black, 0.1);
  return shades;
}

/** Alias used by the generation pipeline. */
export function generateColorPalette(baseHex: string): ColorShades {
  return generateColorShades(baseHex);
}

export function generateNeutralPalette(baseHex: string): ColorShades {
  return generateColorShades(baseHex);
}

/**
 * Builds a single-color token. Dark-mode values are provided by the
 * Mapped/Alias variable tiers (their Dark mode), not by a per-token ramp.
 */
export function createColorToken(name: string, hex: string): ColorToken {
  return {
    name,
    hex,
    hsl: hexToHsl(hex),
    shades: generateColorShades(hex),
  };
}

export interface SemanticColorInput {
  primary: string;
  secondary?: string;
  accent?: string;
  success?: string;
  error?: string;
  warning?: string;
  information?: string;
  neutral?: string;
}

/** Builds the full semantic color system, respecting user-chosen bases. */
export function generateSemanticColors(input: SemanticColorInput): Record<
  'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'information' | 'neutral',
  ColorToken
> {
  const primary = createColorToken('Primary', input.primary);
  const secondary = createColorToken('Secondary', input.secondary ?? '#F97316');
  const accent = createColorToken('Accent', input.accent ?? '#8B5CF6');
  const information = createColorToken(
    'Information',
    input.information ?? shiftHue(input.primary, 180)
  );
  const success = createColorToken('Success', input.success ?? '#10B981');
  const warning = createColorToken('Warning', input.warning ?? '#F59E0B');
  const error = createColorToken('Error', input.error ?? '#EF4444');
  const neutral = createColorToken('Neutral', input.neutral ?? '#64748B');
  return { primary, secondary, accent, success, error, warning, information, neutral };
}

import { GradientPreset, GradientStop } from './types';

export function shiftHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex);
  return hslToHex((hsl.h + degrees + 360) % 360, hsl.s, hsl.l);
}

/** Convert #rrggbb to Figma RGB (0-1). */
export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

export function hexToMonochrome(hex: string): string {
  const rgb = hexToRgb(hex);
  const gray = Math.round((0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) * 255);
  const hexStr = gray.toString(16).padStart(2, '0').toUpperCase();
  return `#${hexStr}${hexStr}${hexStr}`;
}

export function createVibrantBridge(hex: string, hueShift: number, lightnessDelta = 0): string {
  const hsl = hexToHsl(hex);
  const targetH = (hsl.h + hueShift + 360) % 360;
  const s = Math.min(95, Math.max(80, hsl.s));
  const l = Math.min(68, Math.max(48, hsl.l + lightnessDelta));
  return hslToHex(targetH, s, l);
}

import { converter, interpolate, fixupHueShorter, clampChroma, formatHex, Oklch } from 'culori';

const toOklch = converter('oklch');

/** An OKLCH colour with every channel present, so arithmetic on it needs no guards. */
export interface SolidOklch {
  mode: 'oklch';
  l: number;
  c: number;
  h: number;
}

const OKLCH_FALLBACK: SolidOklch = { mode: 'oklch', l: 0.5, c: 0.1, h: 0 };

/**
 * Fill in the channels culori leaves out.
 *
 * `h` is genuinely optional in an OKLCH colour: chroma 0 is achromatic, so
 * culori omits the hue rather than inventing one, and every grey in a neutral
 * ramp arrives here that way. `l` and `c` are always present. Normalising once
 * here is what lets the two dozen arithmetic sites below read `base.h` directly
 * instead of repeating `?? 0` — and repeating it on `l` and `c` as well, which
 * only looked like caution.
 */
function fillOklch(color: Oklch): SolidOklch {
  return { mode: 'oklch', l: color.l, c: color.c, h: color.h ?? 0 };
}

/**
 * Parse a hex to OKLCH with every channel filled in.
 *
 * culori returns undefined for a string it cannot parse, which is reachable:
 * hexes reach this module from imported token files and from free-text input,
 * not only from our own generators. An unparseable colour falls back to a
 * mid-lightness low-chroma grey so the gradient still renders.
 */
function solidOklch(hex: string): SolidOklch {
  const parsed = toOklch(hex);
  return parsed ? fillOklch(parsed) : OKLCH_FALLBACK;
}

export type GradientOklchMode = 'mono' | 'analogous' | 'analogous-cool' | 'tonal' | 'complement' | 'radial' | 'glass';

/**
 * Picks a second color in OKLCH space based on hue/chroma/lightness constraints.
 * Avoids arbitrary >120° hue jumps to prevent dirty gray zones and purple/pink drift.
 */
export function pickSecondColorOklch(
  baseHex: string,
  mode: GradientOklchMode = 'analogous'
): SolidOklch {
  const base = solidOklch(baseHex);
  let l = base.l;
  let c = base.c;
  let h = base.h;

  switch (mode) {
    case 'mono':
      l = clamp(l + (l > 0.5 ? -0.18 : 0.18), 0.15, 0.92);
      break;
    case 'analogous':
      h = (h + 20 + 360) % 360;
      l = clamp(l + 0.08, 0.15, 0.92);
      break;
    case 'analogous-cool':
      h = (h - 20 + 360) % 360;
      l = clamp(l + 0.06, 0.15, 0.92);
      break;
    case 'tonal':
      l = clamp(l - 0.22, 0.12, 0.9);
      c = c * 0.85;
      break;
    case 'complement':
      h = (h + 180) % 360;
      c = c * 0.8;
      break;
    case 'radial':
      l = clamp(l - 0.25, 0.1, 0.85);
      h = (h + 15 + 360) % 360;
      break;
    case 'glass':
      h = (h + 25 + 360) % 360;
      l = clamp(l + 0.05, 0.15, 0.92);
      break;
  }

  return { mode: 'oklch', l, c, h };
}

/**
 * Interpolates endpoints in OKLCH space with shortest-path hue fixup
 * and clamps chroma to sRGB gamut before converting to solid Hex.
 */
export function interpolateOklchStops(
  color1: string | Oklch,
  color2: string | Oklch,
  numStops: number = 3
): GradientStop[] {
  const oklch1 = typeof color1 === 'string' ? solidOklch(color1) : fillOklch(color1);
  const oklch2 = typeof color2 === 'string' ? solidOklch(color2) : fillOklch(color2);

  const interpolator = interpolate([oklch1, oklch2], 'oklch', {
    // Shortest-path hue only. The empty l/c entries are there because culori's
    // override type requires an entry per channel; culori itself treats an
    // entry with no `fixup` as "leave this channel alone".
    l: {},
    c: {},
    h: { fixup: fixupHueShorter },
  });

  const stops: GradientStop[] = [];
  for (let i = 0; i < numStops; i++) {
    const pos = numStops > 1 ? i / (numStops - 1) : 0;
    const raw = interpolator(pos);
    const clamped = clampChroma(raw, 'oklch');
    const hex = formatHex(clamped) || (typeof color1 === 'string' ? color1 : '#000000');
    stops.push({
      color: hex.toUpperCase(),
      opacity: 1,
      position: Number(pos.toFixed(2)),
    });
  }
  return stops;
}

/**
 * Colour of the nth stop in a generated ramp.
 *
 * interpolateOklchStops always returns the length it was asked for, but reading
 * a fixed index cannot prove that, and a stop that did come back missing must
 * not put `undefined` into a Figma paint — that throws inside setFill. The
 * fallback keeps the gradient renderable with a slightly flatter ramp.
 */
function stopColor(stops: GradientStop[], index: number, fallback: string): string {
  return stops[index]?.color ?? fallback;
}

export function generateGradientsForColor(baseHex: string): GradientPreset[] {
  const { l: bl, c: bc, h: bh } = solidOklch(baseHex);

  // 1. Monochromatic Silk (0° hue shift, lightness transition in OKLCH)
  const monoLight = clampChroma({ mode: 'oklch', l: clamp(bl + 0.18, 0.15, 0.95), c: bc, h: bh }, 'oklch');
  const monoDark = clampChroma({ mode: 'oklch', l: clamp(bl - 0.22, 0.1, 0.9), c: bc * 1.05, h: bh }, 'oklch');
  const monoStops = interpolateOklchStops(formatHex(monoLight)!, formatHex(monoDark)!, 3);

  // 2. Analogous Sunset (+20° OKLCH hue shift)
  const analogousWarmColor = formatHex(clampChroma(pickSecondColorOklch(baseHex, 'analogous'), 'oklch'))!;
  const analogousWarmStops = interpolateOklchStops(baseHex, analogousWarmColor, 3);

  // 3. Analogous Dusk (-20° OKLCH hue shift)
  const analogousCoolColor = formatHex(clampChroma(pickSecondColorOklch(baseHex, 'analogous-cool'), 'oklch'))!;
  const analogousCoolStops = interpolateOklchStops(baseHex, analogousCoolColor, 3);

  // 4. Radial Focus Glow (Center highlight to dark depth in OKLCH)
  const radialCenter = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl + 0.16, 0.2, 0.95), c: bc * 0.95, h: bh }, 'oklch'))!;
  const radialOuter = formatHex(clampChroma(pickSecondColorOklch(baseHex, 'radial'), 'oklch'))!;
  const radialStops = interpolateOklchStops(radialCenter, radialOuter, 3);

  // 5. Pastel Velvet (Soft 3-stop OKLCH pastel transition with low chroma)
  const pastelStart = formatHex(clampChroma({ mode: 'oklch', l: 0.82, c: 0.08, h: bh }, 'oklch'))!;
  const pastelEnd = formatHex(clampChroma({ mode: 'oklch', l: 0.72, c: 0.12, h: (bh + 35) % 360 }, 'oklch'))!;
  const pastelStops = interpolateOklchStops(pastelStart, pastelEnd, 3);

  // 6. Royal Satin (Balanced OKLCH hue & lightness transfer)
  const royalStart = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl + 0.06, 0.15, 0.9), c: bc, h: (bh - 15 + 360) % 360 }, 'oklch'))!;
  const royalEnd = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl - 0.1, 0.12, 0.85), c: bc, h: (bh + 30) % 360 }, 'oklch'))!;
  const royalStops = interpolateOklchStops(royalStart, royalEnd, 3);

  // 7. Aurora Flow (Fluid 3-stop OKLCH wave)
  const auroraEnd = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl + 0.08, 0.15, 0.92), c: bc * 1.1, h: (bh + 45) % 360 }, 'oklch'))!;
  const auroraStops = interpolateOklchStops(baseHex, auroraEnd, 3);

  // 8. Twilight Spotlight (Radial OKLCH pulse)
  const twilightCenter = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl + 0.14, 0.2, 0.95), c: bc, h: (bh + 20) % 360 }, 'oklch'))!;
  const twilightOuter = formatHex(clampChroma({ mode: 'oklch', l: clamp(bl - 0.25, 0.1, 0.8), c: bc * 0.9, h: (bh - 25 + 360) % 360 }, 'oklch'))!;
  const twilightStops = interpolateOklchStops(twilightCenter, twilightOuter, 3);

  // 9. Glassmorphic Fade (Translucent UI card gradient in OKLCH)
  const glassEnd = formatHex(clampChroma(pickSecondColorOklch(baseHex, 'glass'), 'oklch'))!;
  const glassOklchStops = interpolateOklchStops(baseHex, glassEnd, 3);
  const glassStops: GradientStop[] = [
    { color: stopColor(glassOklchStops, 0, baseHex), opacity: 1, position: 0 },
    { color: stopColor(glassOklchStops, 1, baseHex), opacity: 0.82, position: 0.5 },
    { color: stopColor(glassOklchStops, 2, glassEnd), opacity: 0.35, position: 1 },
  ];

  const presets: {
    id: string;
    name: string;
    description: string;
    type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
    stops: GradientStop[];
  }[] = [
    {
      id: 'monochromatic',
      name: 'Monochromatic Silk',
      description: 'Monochrome: Calm, premium OKLCH 3-stop transition within the same color family',
      type: 'GRADIENT_LINEAR',
      stops: monoStops,
    },
    {
      id: 'analogous-warm',
      name: 'Analogous Sunset',
      description: 'Analogous: Vibrant, seamless OKLCH 3-stop blend across neighboring warm hues',
      type: 'GRADIENT_LINEAR',
      stops: analogousWarmStops,
    },
    {
      id: 'analogous-cool',
      name: 'Analogous Dusk',
      description: 'Analogous: Rich, soothing OKLCH 3-stop transition into adjacent cool hues',
      type: 'GRADIENT_LINEAR',
      stops: analogousCoolStops,
    },
    {
      id: 'radial-spotlight',
      name: 'Radial Focus Glow',
      description: 'Radial: Luminous central OKLCH spotlight radiating into rich outer depth',
      type: 'GRADIENT_RADIAL',
      stops: radialStops,
    },
    {
      id: 'soft-pastel',
      name: 'Pastel Velvet',
      description: 'Soft 3-stop OKLCH pastel gradient with gentle midpoint saturation',
      type: 'GRADIENT_LINEAR',
      stops: pastelStops,
    },
    {
      id: 'royal-satin',
      name: 'Royal Satin',
      description: 'Luxurious 3-stop OKLCH blend featuring balanced hue & lightness transfer',
      type: 'GRADIENT_LINEAR',
      stops: royalStops,
    },
    {
      id: 'aurora-flow',
      name: 'Aurora Flow',
      description: 'Fluid 3-stop OKLCH wave with luminous midpoint transfer and no gray dead zones',
      type: 'GRADIENT_LINEAR',
      stops: auroraStops,
    },
    {
      id: 'twilight-pulse',
      name: 'Twilight Spotlight',
      description: 'Radial 3-stop OKLCH focal pulse with vibrant midpoint hue shift',
      type: 'GRADIENT_RADIAL',
      stops: twilightStops,
    },
    {
      id: 'glass-fade',
      name: 'Glassmorphic Fade',
      description: 'Modern 3-stop translucent OKLCH gradient designed for UI overlay cards',
      type: 'GRADIENT_LINEAR',
      stops: glassStops,
    },
  ];

  return presets.map((p) => {
    const stopsCss = p.stops
      .map((s) => {
        if (s.opacity < 1) {
          const rgb = hexToRgb(s.color);
          const r = Math.round(rgb.r * 255);
          const g = Math.round(rgb.g * 255);
          const b = Math.round(rgb.b * 255);
          return `rgba(${r}, ${g}, ${b}, ${s.opacity}) ${Math.round(s.position * 100)}%`;
        }
        return `${s.color} ${Math.round(s.position * 100)}%`;
      })
      .join(', ');

    const monoStopsCss = p.stops
      .map((s) => {
        const monoColor = hexToMonochrome(s.color);
        if (s.opacity < 1) {
          const rgb = hexToRgb(monoColor);
          const r = Math.round(rgb.r * 255);
          const g = Math.round(rgb.g * 255);
          const b = Math.round(rgb.b * 255);
          return `rgba(${r}, ${g}, ${b}, ${s.opacity}) ${Math.round(s.position * 100)}%`;
        }
        return `${monoColor} ${Math.round(s.position * 100)}%`;
      })
      .join(', ');

    let css = '';
    let monochromeCss = '';

    if (p.type === 'GRADIENT_RADIAL') {
      css = `radial-gradient(circle at center, ${stopsCss})`;
      monochromeCss = `radial-gradient(circle at center, ${monoStopsCss})`;
    } else if (p.type === 'GRADIENT_ANGULAR') {
      css = `conic-gradient(from 0deg at 50% 50%, ${stopsCss})`;
      monochromeCss = `conic-gradient(from 0deg at 50% 50%, ${monoStopsCss})`;
    } else if (p.type === 'GRADIENT_DIAMOND') {
      css = `radial-gradient(ellipse at center, ${stopsCss})`;
      monochromeCss = `radial-gradient(ellipse at center, ${monoStopsCss})`;
    } else {
      css = `linear-gradient(135deg, ${stopsCss})`;
      monochromeCss = `linear-gradient(135deg, ${monoStopsCss})`;
    }

    return { ...p, css, monochromeCss };
  });
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
