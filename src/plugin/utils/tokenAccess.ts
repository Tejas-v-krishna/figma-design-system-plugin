// Helpers to read resolved values out of a DesignTokens object.
import { DesignTokens, TypographyToken, ShadowToken, ColorToken } from '../../shared/types';

export type ColorName = 'primary' | 'success' | 'error' | 'warning' | 'information' | 'neutral';

export function colorToken(tokens: DesignTokens, name: ColorName): ColorToken {
  return tokens.colors[name];
}

export function colorShade(tokens: DesignTokens, name: ColorName, shade: string | number): string {
  const token = tokens.colors[name];
  const key = String(shade) as unknown as keyof ColorToken['shades'];
  return token.shades[key] ?? token.hex;
}

/** Resolve a shade name from a possibly-compound key like "primary/500". */
export function colorShadeByPath(tokens: DesignTokens, path: string): string {
  const [name, shade] = path.split('/');
  const token = (tokens.colors as any)[name] as ColorToken | undefined;
  if (!token) return '#000000';
  if (!shade) return token.hex;
  return token.shades[shade as unknown as keyof ColorToken['shades']] ?? token.hex;
}

export function textToken(tokens: DesignTokens, name: string): TypographyToken | undefined {
  return tokens.typography.find((t) => t.name === name);
}

export function firstTextOfGroup(tokens: DesignTokens, group: 'headings' | 'body' | 'ui'): TypographyToken | undefined {
  return tokens.typography.find((t) => t.group === group);
}

export function radiusPx(tokens: DesignTokens, name: string): number {
  const r = tokens.borderRadius.find((b) => b.name === name);
  return r ? r.px : 8;
}

export function spacing(tokens: DesignTokens, name: string): number {
  const s = tokens.spacing.find((sp) => sp.name === name);
  return s ? s.value : 16;
}

export function shadow(tokens: DesignTokens, name: string): ShadowToken | undefined {
  return tokens.shadows.find((s) => s.name === name);
}
