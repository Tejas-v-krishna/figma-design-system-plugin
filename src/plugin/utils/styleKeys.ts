// Canonical style-name keys shared by generate.ts (writer) and the factory (reader).
import { formatTokenName, formatStyleName, DEFAULT_NAMING } from '../../shared/naming';

/**
 * The top-level group each kind of generated style lives under.
 *
 * Exported because "which local styles does this plugin own?" is a question two
 * commands need to answer — the generator, to update rather than duplicate, and
 * the overwrite check, to count what a run would change. Deriving both from
 * these constants means the two can't drift apart.
 */
export const STYLE_GROUPS = {
  color: 'Color',
  text: 'Typography',
  effect: 'Effect',
} as const;

export function colorStyleKey(colorName: string, shade: string | number): string {
  return formatTokenName(STYLE_GROUPS.color, colorName, String(shade), DEFAULT_NAMING);
}

export function textStyleKey(tokenName: string): string {
  return formatStyleName(STYLE_GROUPS.text, tokenName, undefined, DEFAULT_NAMING);
}

export function effectStyleKey(shadowName: string): string {
  return formatStyleName(STYLE_GROUPS.effect, 'Shadow', shadowName, DEFAULT_NAMING);
}

export function semanticColorKey(name: string): string {
  return formatTokenName(STYLE_GROUPS.color, name, undefined, DEFAULT_NAMING);
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
