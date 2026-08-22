// Design System Kit — how many components one definition actually produces.
//
// Lives in shared/ because both sides need it: the plugin sandbox builds the
// nodes, and the UI has to label each card with a truthful number before
// anything is generated. Pure — no Figma API, no React.
import { ComponentDefinition, GenerationConfig } from './types';

/** Just the three options that affect how many components get built. */
export type VariantCountOptions = Pick<
  GenerationConfig['options'],
  'includeVariants' | 'includeStates' | 'generateFullVariantSets'
>;

/**
 * The number of components `generateComponents` will create for one definition.
 *
 * Mirrors src/plugin/utils/factory/index.ts, which has two paths:
 *
 * - `generateFullVariantSets` — buildVariantSet walks the full
 *   variant x size x state matrix and combines it into one ComponentSet, so the
 *   count is multiplicative.
 * - otherwise — buildSet creates one default component plus one extra per
 *   off-default value on each enabled axis, so the count is additive.
 *
 * An axis with no declared values contributes exactly 1 (its synthesized
 * default), never 0.
 */
export function countComponentsFor(def: ComponentDefinition, options: VariantCountOptions): number {
  const variants = options.includeVariants ? Math.max(1, def.variants.length) : 1;
  const sizes = options.includeVariants ? Math.max(1, def.sizes.length) : 1;
  const states = options.includeStates ? Math.max(1, def.states.length) : 1;

  if (options.generateFullVariantSets) {
    return variants * sizes * states;
  }

  return 1 + (variants - 1) + (sizes - 1) + (states - 1);
}

/** Total across a set of definitions — used for the "will create N" summary. */
export function countComponentsForAll(
  defs: ComponentDefinition[],
  options: VariantCountOptions
): number {
  return defs.reduce((total, def) => total + countComponentsFor(def, options), 0);
}
