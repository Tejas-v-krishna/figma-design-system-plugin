// Helpers to read resolved values out of a DesignTokens object.
import { DesignTokens, TypographyToken, ShadowToken, ColorToken, ColorShades } from '../../shared/types';

export type ColorName = 'primary' | 'success' | 'error' | 'warning' | 'information' | 'neutral';

/** Last-resort colour when a family is missing entirely. Neutral, not black. */
const MISSING_COLOR = '#64748B';

/**
 * DesignTokens.colors carries an index signature, so the type says every lookup
 * succeeds while at runtime a family can be absent — a config with a trimmed
 * palette, or a token tree deserialised from an older export. Reading `.shades`
 * off the result then threw with no indication of which family was missing, in
 * the middle of a generation run.
 *
 * Every read of a colour family goes through here so that a gap degrades to a
 * placeholder swatch and a warning, and the rest of the system still builds.
 */
function findColor(tokens: DesignTokens, name: string): ColorToken | undefined {
  const token: ColorToken | undefined = tokens.colors[name];
  if (!token) console.warn(`[design-system-kit] no colour family named "${name}" in the token set`);
  return token;
}

/** The shade steps that actually exist, so an unknown step is caught by lookup. */
const SHADE_KEYS: (keyof ColorShades)[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

function shadeOf(token: ColorToken, shade: string | number): string {
  // Matching against the known keys rather than casting the string into
  // `keyof ColorShades` means an out-of-range step like "1000" returns the base
  // hex instead of typechecking fine and yielding undefined at runtime.
  const wanted = Number(shade);
  const key = SHADE_KEYS.find((k) => k === wanted);
  return key === undefined ? token.hex : token.shades[key];
}

export function colorShade(tokens: DesignTokens, name: ColorName, shade: string | number): string {
  const token = findColor(tokens, name);
  if (!token) return MISSING_COLOR;
  return shadeOf(token, shade);
}

/** Resolve a shade name from a possibly-compound key like "primary/500". */
export function colorShadeByPath(tokens: DesignTokens, path: string): string {
  const [name, shade] = path.split('/');
  if (!name) return MISSING_COLOR;
  const token = findColor(tokens, name);
  if (!token) return MISSING_COLOR;
  return shade ? shadeOf(token, shade) : token.hex;
}

export function textToken(tokens: DesignTokens, name: string): TypographyToken | undefined {
  return tokens.typography.find((t) => t.name === name);
}

export function firstTextOfGroup(tokens: DesignTokens, group: 'headings' | 'body' | 'ui'): TypographyToken | undefined {
  return tokens.typography.find((t) => t.group === group);
}

/**
 * These three used to return their fallback in silence. That is how every
 * `radiusPx(tokens, 'md')` call site in the component templates went years
 * asking for a step name the radius scale never contained — the scale was
 * `none,1..7` — and got the hardcoded 8 back instead. Nothing in the plugin,
 * the build or the type checker could see it: the lookup is a string against
 * a name field, and the fallback is a plausible-looking number.
 *
 * They still fall back, because a missing step is not worth aborting a
 * generation run over, but now they say so. Same shape as findColor above.
 */
function missing(kind: string, name: string, fallback: string): void {
  console.warn(
    `[design-system-kit] no ${kind} token named "${name}" — using ${fallback}. ` +
      `This is a bug: the requested name is not in the scale.`,
  );
}

export function radiusPx(tokens: DesignTokens, name: string): number {
  const r = tokens.borderRadius.find((b) => b.name === name);
  if (!r) {
    missing('border-radius', name, '8px');
    return 8;
  }
  return r.px;
}

export function spacing(tokens: DesignTokens, name: string): number {
  const s = tokens.spacing.find((sp) => sp.name === name);
  if (!s) {
    missing('spacing', name, '16px');
    return 16;
  }
  return s.value;
}

export function shadow(tokens: DesignTokens, name: string): ShadowToken | undefined {
  const s = tokens.shadows.find((sh) => sh.name === name);
  // Callers pass the result straight to setEffect, which no-ops on undefined —
  // so an unknown name meant a component quietly rendered with no shadow.
  if (!s) missing('shadow', name, 'no shadow');
  return s;
}
