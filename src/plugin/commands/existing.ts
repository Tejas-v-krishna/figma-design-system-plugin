// Design System Kit — what already exists in this document
//
// Answers the question the UI has to ask before it overwrites anything: is there
// already a design system here, and how big is it? Kept separate from scan.ts
// because that walks the whole node tree to audit usage, whereas this reads only
// page names and the local style lists — cheap enough to run on every click of
// the generate button without the user noticing.
import { STYLE_GROUPS } from '../utils/styleKeys';
import { FULL_RUN_PAGE_NAMES } from './generate';

export interface ExistingSummary {
  /** Names of the generator's own pages that are already in the document. */
  pages: string[];
  /** Local styles whose name is in a group this generator owns. */
  paintStyles: number;
  textStyles: number;
  effectStyles: number;
  /** Same-named styles that already appear more than once, from a pre-fix build. */
  duplicateStyles: number;
  /** True when a generate would change something that is already there. */
  hasAny: boolean;
}

/**
 * Whether a style name belongs to this plugin.
 *
 * Group-prefix matching rather than an exact key list: the token set changes
 * between versions, and a name-by-name check would undercount a system built by
 * an older build. The trade-off is that a hand-made style the user happened to
 * file under "Color/" is counted as ours — which is the safer error, because it
 * means the confirmation appears when in doubt rather than being skipped.
 */
function isOwned(name: string): boolean {
  return Object.values(STYLE_GROUPS).some((group) => name.startsWith(`${group}/`));
}

function countOwned(names: string[]): { owned: number; duplicates: number } {
  const seen = new Set<string>();
  let owned = 0;
  let duplicates = 0;
  for (const name of names) {
    if (!isOwned(name)) continue;
    owned++;
    if (seen.has(name)) duplicates++;
    else seen.add(name);
  }
  return { owned, duplicates };
}

export async function summarizeExisting(): Promise<ExistingSummary> {
  const [paints, texts, effects] = await Promise.all([
    figma.getLocalPaintStylesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
  ]);

  const paint = countOwned(paints.map((s) => s.name));
  const text = countOwned(texts.map((s) => s.name));
  const effect = countOwned(effects.map((s) => s.name));

  // Page names only — no findAll — so this stays fast on a large document and
  // needs no loadAllPagesAsync.
  const present = new Set(figma.root.children.map((p) => p.name));
  const pages = FULL_RUN_PAGE_NAMES.filter((name) => present.has(name));

  return {
    pages,
    paintStyles: paint.owned,
    textStyles: text.owned,
    effectStyles: effect.owned,
    duplicateStyles: paint.duplicates + text.duplicates + effect.duplicates,
    hasAny: pages.length > 0 || paint.owned + text.owned + effect.owned > 0,
  };
}
