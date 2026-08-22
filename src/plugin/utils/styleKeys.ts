// Canonical style-name keys shared by generate.ts (writer) and the factory (reader).
import { formatTokenName, formatStyleName, DEFAULT_NAMING } from '../../shared/naming';

export function colorStyleKey(colorName: string, shade: string | number): string {
  return formatTokenName('Color', colorName, String(shade), DEFAULT_NAMING);
}

export function textStyleKey(tokenName: string): string {
  return formatStyleName('Typography', tokenName, undefined, DEFAULT_NAMING);
}

export function effectStyleKey(shadowName: string): string {
  return formatStyleName('Effect', 'Shadow', shadowName, DEFAULT_NAMING);
}

export function semanticColorKey(name: string): string {
  return formatTokenName('Color', name, undefined, DEFAULT_NAMING);
}

/** Maps a human style name -> the Figma style id. */
export interface StyleMap {
  color: Record<string, string>;
  text: Record<string, string>;
  effect: Record<string, string>;
}

export function emptyStyleMap(): StyleMap {
  return { color: {}, text: {}, effect: {} };
}
