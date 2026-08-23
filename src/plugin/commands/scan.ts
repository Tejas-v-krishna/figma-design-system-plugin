// Design System Kit - Usage scan command
// Counts component instances, local styles, and detects unbound fills.
import { UsageReport } from '../../shared/types';
import { yieldToUI } from '../utils/yield';

/** A node that can be asked about its fills, without widening anything to `any`. */
interface FillReadable {
  fills: ReadonlyArray<Paint> | symbol;
  fillStyleId: string | symbol;
}

function hasFills(node: SceneNode): node is SceneNode & FillReadable {
  return 'fills' in node;
}

/**
 * How many of a node's fills are a solid colour with no paint style behind them.
 *
 * Returns 0 for a node whose fills are `figma.mixed` (a text node with
 * per-character colours): there is no array to walk, and guessing would put a
 * wrong number in a report whose whole purpose is to be trusted.
 *
 * `fillStyleId` is likewise `figma.mixed` when different fills carry different
 * styles. That counts as bound, because at least one style is in play and the
 * node is not the "raw hex everywhere" case this metric is looking for.
 */
function unboundSolidFills(node: SceneNode & FillReadable): number {
  const fills = node.fills;
  if (!Array.isArray(fills)) return 0;

  // Read once per node rather than once per fill — the old code re-read this
  // inside the fill loop, which on a large file is thousands of redundant reads
  // across the plugin/document bridge.
  const styleId = node.fillStyleId;
  if (typeof styleId !== 'string' || styleId !== '') return 0;

  let count = 0;
  for (const fill of fills as ReadonlyArray<Paint>) {
    if (fill.type === 'SOLID') count++;
  }
  return count;
}

/**
 * How many main-component lookups to resolve at once.
 *
 * getMainComponentAsync has to be awaited per instance, and a file with tens of
 * thousands of instances would otherwise be tens of thousands of sequential
 * round trips. Batching keeps them in flight together while still yielding to
 * the event loop often enough that progress updates reach the UI.
 */
const LOOKUP_BATCH = 200;

export interface ScanProgress {
  /** 0–100. */
  progress: number;
  message: string;
}

export async function scanUsage(onProgress?: (p: ScanProgress) => void): Promise<UsageReport> {
  const report = (progress: number, message: string) => onProgress?.({ progress, message });

  // Under documentAccess: "dynamic-page" only the current page is loaded at
  // start, so every other page's nodes are inaccessible until we explicitly
  // load them. Do this once up front, then the sync tree walks below are safe.
  report(2, 'Loading pages…');
  await figma.loadAllPagesAsync();

  const pages = figma.root.children;
  const instances: InstanceNode[] = [];
  let unboundFills = 0;

  // One traversal per page, not two. Instances and fills were counted in
  // separate findAll passes, so every node in the document was visited twice —
  // the single most expensive thing this command did on a large file.
  for (const [index, page] of pages.entries()) {
    report(
      5 + Math.round((index / Math.max(1, pages.length)) * 55),
      `Scanning ${page.name}…`
    );
    for (const node of page.findAll(() => true)) {
      if (node.type === 'INSTANCE') instances.push(node);
      if (hasFills(node)) unboundFills += unboundSolidFills(node);
    }
    // Yield between pages so the UI can paint the progress bar. This has to be a
    // macrotask: `await Promise.resolve()` drains inside the same task, so the
    // sandbox never handed control back and the whole scan still ran as one
    // blocking block with every progress message delivered at the end.
    await yieldToUI();
  }

  const counts: Record<string, number> = {};
  for (let start = 0; start < instances.length; start += LOOKUP_BATCH) {
    const batch = instances.slice(start, start + LOOKUP_BATCH);
    report(
      60 + Math.round((start / Math.max(1, instances.length)) * 30),
      `Identifying components (${start.toLocaleString()} of ${instances.length.toLocaleString()})…`
    );
    // `instance.mainComponent` is WRITE-ONLY under documentAccess:
    // "dynamic-page" — reading it throws, which it did on the first instance in
    // the document, so this command failed outright on any file that contained
    // one. getMainComponentAsync is the readable form.
    const names = await Promise.all(
      batch.map(async (inst) => {
        try {
          const main = await inst.getMainComponentAsync();
          return main?.name ?? inst.name;
        } catch {
          // A remote component from a library the user cannot currently access.
          // Its instance name is still a useful label, so degrade to that rather
          // than dropping the instance out of the totals.
          return inst.name;
        }
      })
    );
    for (const name of names) {
      counts[name] = (counts[name] ?? 0) + 1;
    }
  }

  report(92, 'Counting styles…');
  const [colorStyles, textStyles, effectStyles] = await Promise.all([
    figma.getLocalPaintStylesAsync(),
    figma.getLocalTextStylesAsync(),
    figma.getLocalEffectStylesAsync(),
  ]);

  const components = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  report(100, 'Scan complete');
  return {
    components,
    totalInstances: instances.length,
    colorStyles: colorStyles.length,
    textStyles: textStyles.length,
    effectStyles: effectStyles.length,
    unboundFills,
    pages: pages.length,
  };
}
