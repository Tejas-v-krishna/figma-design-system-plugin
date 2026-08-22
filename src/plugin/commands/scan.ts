// Design System Kit - Usage scan command
// Counts component instances, local styles, and detects unbound fills.
import { UsageReport } from '../../shared/types';

export async function scanUsage(): Promise<UsageReport> {
  // Under documentAccess: "dynamic-page" only the current page is loaded at
  // start, so every other page's nodes are inaccessible until we explicitly
  // load them. Do this once up front, then the sync tree walks below are safe.
  await figma.loadAllPagesAsync();

  const counts: Record<string, number> = {};
  let totalInstances = 0;

  for (const page of figma.root.children) {
    const instances = page.findAll((n) => n.type === 'INSTANCE');
    for (const inst of instances) {
      const comp = (inst as InstanceNode).mainComponent;
      const name = comp ? comp.name : inst.name;
      counts[name] = (counts[name] ?? 0) + 1;
      totalInstances++;
    }
  }

  const colorStyles = (await figma.getLocalPaintStylesAsync()).length;
  const textStyles = (await figma.getLocalTextStylesAsync()).length;
  const effectStyles = (await figma.getLocalEffectStylesAsync()).length;

  let unboundFills = 0;
  for (const page of figma.root.children) {
    const nodes = page.findAll((n) => 'fills' in n);
    for (const n of nodes) {
      const fills = (n as any).fills as Paint[] | symbol;
      if (Array.isArray(fills)) {
        for (const f of fills) {
          if (f.type === 'SOLID' && !(n as any).fillStyleId) unboundFills++;
        }
      }
    }
  }

  const components = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return {
    components,
    totalInstances,
    colorStyles,
    textStyles,
    effectStyles,
    unboundFills,
    pages: figma.root.children.length,
  };
}
