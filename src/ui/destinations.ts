import { TokenCounts } from '../shared/token-counts';

/**
 * The rail, as data.
 *
 * One table drives navigation, the sheet head, the per-item token counts and the
 * Build button's target. Before this the same navigation was spread across three
 * levels — a tab bar over `view`, a sidebar over `tokenCategory`, and a footer
 * action per view — which is the arrangement docs/DESIGN.md set out to collapse.
 *
 * `target` is deliberately separate from `id`. The sandbox's target vocabulary is
 * fixed (see below) and an unrecognised value falls through to a full rebuild, so
 * rail identity and generation target must be free to differ. That is what lets
 * Shape exist as one destination over two token scales.
 */

export type DestinationId =
  | 'colour'
  | 'gradients'
  | 'type'
  | 'space'
  | 'shape'
  | 'depth'
  | 'motion'
  | 'components'
  | 'audit'
  | 'export';

export type DestinationGroup = 'foundations' | 'library';

export interface Destination {
  id: DestinationId;
  group: DestinationGroup;
  /** Rail label. The doc's vocabulary, which names the design property rather than the CSS one. */
  label: string;
  /** Sheet head. */
  title: string;
  sub: string;
  /**
   * Generation target posted to the sandbox.
   *
   * Absent means this destination has nothing to build, and the rail shows no
   * Build button for it. Three destinations are in that position for two
   * different reasons: Audit and Export own their own action inside the sheet,
   * and Motion is not generated at all — no exporter emits it and buildTokens
   * has no motion field, so a Build would have nothing to write.
   *
   * Every value present here must be one the sandbox recognises:
   * 'colors' | 'components' | 'gradients' | 'shape' | and the TokenBoardTargets
   * 'typography' | 'spacing' | 'radius' | 'stroke' | 'effects'. Anything else
   * falls through to the full five-page rebuild — see the comment at
   * plugin/commands/generate.ts, which documents that bug being fixed once.
   */
  target?: string;
  /** Token count shown in the rail. Absent for library destinations, which don't hold tokens. */
  count?: (c: TokenCounts) => number;
  /** Right-hand note in the sheet head. */
  meta?: (c: TokenCounts) => string;
}

const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;

export const DESTINATIONS: Destination[] = [
  {
    id: 'colour',
    group: 'foundations',
    label: 'Colour',
    title: 'Colour',
    sub: 'Every family ramps to eleven steps, 50 through 950, with a dark counterpart.',
    target: 'colors',
    // Families, not shades: eleven steps of one family is one decision, and the
    // doc's rail reads "Colour 8" against a sheet head of "8 ramps".
    count: (c) => c.colorFamilies,
    meta: (c) => `${plural(c.colorFamilies, 'ramp')} · ${c.colors} tokens`,
  },
  {
    id: 'gradients',
    group: 'foundations',
    label: 'Gradients',
    title: 'Gradients',
    sub: 'Derived from the primary colour in OKLCH, so every stop stays in gamut.',
    target: 'gradients',
    count: (c) => c.gradients,
    meta: (c) => plural(c.gradients, 'preset'),
  },
  {
    id: 'type',
    group: 'foundations',
    label: 'Type',
    title: 'Type',
    sub: 'A scale built from your base size, set in the faces you chose.',
    target: 'typography',
    count: (c) => c.typography,
    meta: (c) => plural(c.typography, 'style'),
  },
  {
    id: 'space',
    group: 'foundations',
    label: 'Space',
    title: 'Space',
    sub: 'A spacing scale stepped off your base grid.',
    target: 'spacing',
    count: (c) => c.spacing,
    meta: (c) => plural(c.spacing, 'step'),
  },
  {
    id: 'shape',
    group: 'foundations',
    label: 'Shape',
    title: 'Shape',
    sub: 'Corner radius and stroke width: the two scales that set an interface edge.',
    // A composite target: the sandbox runs both board builders under it. Radius
    // and stroke are one design decision read two ways, and they are the two
    // smallest scales in the system, so they share a sheet.
    target: 'shape',
    count: (c) => c.radius + c.stroke,
    meta: (c) => `${plural(c.radius, 'radius', 'radii')} · ${plural(c.stroke, 'stroke')}`,
  },
  {
    id: 'depth',
    group: 'foundations',
    label: 'Depth',
    title: 'Depth',
    sub: 'An elevation ramp. Intensity scales the whole ramp rather than trimming steps off it.',
    target: 'effects',
    count: (c) => c.elevation,
    meta: (c) => plural(c.elevation, 'level'),
  },
  {
    id: 'motion',
    group: 'foundations',
    label: 'Motion',
    title: 'Motion',
    sub: 'Durations named by intent and easings shaped by role.',
    count: (c) => c.motion,
    meta: (c) => `${plural(c.motion, 'token')} · reference`,
  },
  {
    id: 'components',
    group: 'library',
    label: 'Components',
    title: 'Components',
    sub: 'Pick what to build. Every component is drawn from the tokens above.',
    target: 'components',
  },
  {
    id: 'audit',
    group: 'library',
    label: 'Audit',
    title: 'Audit',
    sub: 'Find layers in this file that use raw values instead of your tokens.',
  },
  {
    id: 'export',
    group: 'library',
    label: 'Export',
    title: 'Export',
    sub: 'Your tokens as CSS, Tailwind, DTCG or JSON.',
  },
];

const BY_ID = new Map<DestinationId, Destination>(DESTINATIONS.map((d) => [d.id, d]));

export function destination(id: DestinationId): Destination {
  const found = BY_ID.get(id);
  // The map is built from the table and keyed by the union, so every id the type
  // admits has an entry. Throwing rather than returning a fallback keeps a typo
  // in a future destination from rendering a plausible-looking wrong sheet.
  if (!found) throw new Error(`Unknown destination: ${id}`);
  return found;
}

export const FOUNDATIONS = DESTINATIONS.filter((d) => d.group === 'foundations');
export const LIBRARY = DESTINATIONS.filter((d) => d.group === 'library');
