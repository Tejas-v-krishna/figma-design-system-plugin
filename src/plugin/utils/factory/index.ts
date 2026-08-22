// Orchestrates component generation: builds a category frame per category and
// populates it with each selected component's main instance plus a bounded set
// of variant / size / state siblings (flat ComponentNodes, well-named).
import { ComponentDefinition, DesignTokens, GenerationConfig } from '../../../shared/types';
import { COMPONENT_DEFINITIONS } from '../../../shared/component-definitions';
import { formatComponentName, DEFAULT_NAMING } from '../../../shared/naming';
import { StyleMap } from '../styleKeys';
import { TEMPLATES, Template, TemplateCtx } from './templates';
import { fallbackTemplate } from './categoryFallback';
import { makeComponent } from '../primitives';
import { VariableMap, emptyVariableMap } from '../variables';

const CATEGORY_LABELS: Record<string, string> = {
  buttons: 'Buttons',
  inputs: 'Inputs',
  forms: 'Forms',
  cards: 'Cards',
  feedback: 'Feedback',
  navigation: 'Navigation',
  'data-display': 'Data Display',
  overlays: 'Overlays',
  media: 'Media',
  typography: 'Typography',
};

interface PropSet {
  name: string;
  properties: Record<string, any>;
}

function pickDefault<T extends PropSet>(arr: T[], prefs: string[]): T {
  if (!arr.length) return { name: 'Default', properties: {} } as T;
  for (const p of prefs) {
    const f = arr.find((a) => a.name.toLowerCase() === p);
    if (f) return f;
  }
  return arr[0];
}

function buildOne(
  def: ComponentDefinition,
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  tmpl: Template,
  variant: PropSet,
  state: PropSet,
  size: PropSet,
  vLabel?: string,
  sLabel?: string,
  szLabel?: string,
  varMap?: VariableMap
): ComponentNode {
  const name = formatComponentName(def.category, def.name, vLabel, sLabel, szLabel, DEFAULT_NAMING);
  const root = makeComponent(name);
  const ctx: TemplateCtx = {
    def,
    tokens,
    config,
    styleMap,
    varMap,
    variantName: variant.name,
    variantProps: variant.properties,
    stateName: state.name,
    stateProps: state.properties,
    sizeName: size.name,
    sizeProps: size.properties,
  };
  return tmpl(root, ctx);
}

function buildSet(
  def: ComponentDefinition,
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  varMap?: VariableMap
): { nodes: ComponentNode[]; primary: ComponentNode } {
  const tmpl = TEMPLATES[def.name] ?? fallbackTemplate;
  const dv = pickDefault(def.variants, ['default']);
  const ds = pickDefault(def.states, ['default']);
  const dz = pickDefault(def.sizes, ['md', 'default', 'sm']);

  const nodes: ComponentNode[] = [];
  const primary = buildOne(def, tokens, config, styleMap, tmpl, dv, ds, dz, undefined, undefined, undefined, varMap);
  nodes.push(primary);

  if (config.options.includeVariants) {
    for (const v of def.variants) {
      if (v !== dv) nodes.push(buildOne(def, tokens, config, styleMap, tmpl, v, ds, dz, v.name, undefined, undefined, varMap));
    }
    for (const sz of def.sizes) {
      if (sz !== dz) nodes.push(buildOne(def, tokens, config, styleMap, tmpl, dv, ds, sz, undefined, undefined, sz.name, varMap));
    }
  }
  if (config.options.includeStates) {
    for (const st of def.states) {
      if (st !== ds) nodes.push(buildOne(def, tokens, config, styleMap, tmpl, dv, st, dz, undefined, st.name, undefined, varMap));
    }
  }
  return { nodes, primary };
}

export function generateComponents(
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  componentsPage: PageNode,
  onProgress?: (fraction: number) => void,
  varMap: VariableMap = emptyVariableMap()
): { count: number; byName: Map<string, ComponentNode | ComponentSetNode> } {
  const selected = COMPONENT_DEFINITIONS.filter((d) => config.componentsToGenerate.includes(d.name));
  const frames: Record<string, FrameNode> = {};
  const byName = new Map<string, ComponentNode | ComponentSetNode>();
  let count = 0;

  for (const def of selected) {
    if (!frames[def.category]) {
      const frame = figma.createFrame();
      frame.name = CATEGORY_LABELS[def.category] ?? def.category;
      frame.layoutMode = 'HORIZONTAL';
      frame.primaryAxisAlignItems = 'MIN';
      frame.counterAxisAlignItems = 'MIN';
      frame.itemSpacing = 48;
      frame.fills = [];
      frame.clipsContent = false;
      componentsPage.appendChild(frame);
      frames[def.category] = frame;
    }
    const frame = frames[def.category];
    let primary: ComponentNode | ComponentSetNode | undefined;
    // Isolate each component: a single failing template must never abort the
    // whole run (which would leave later components and pages blank). Skip the
    // offender and keep going.
    try {
      if (config.options.generateFullVariantSets) {
        const result = buildVariantSet(def, tokens, config, styleMap, varMap, frame);
        count += result.count;
        primary = result.primary;
      } else {
        const result = buildSet(def, tokens, config, styleMap, varMap);
        result.nodes.forEach((n) => frame.appendChild(n));
        count += result.nodes.length;
        primary = result.primary;
      }
    } catch (err) {
      console.error(`[design-system-kit] component "${def.name}" failed to generate:`, err);
    }
    // Record the default node per component so downstream consumers (e.g. the
    // Playground) can instantiate real components by name.
    if (primary && !byName.has(def.name)) {
      byName.set(def.name, primary);
    }
    onProgress?.(count / Math.max(1, selected.length));
  }

  Object.values(frames).forEach((f) => f.resize(1600, Math.max(400, f.height)));
  return { count, byName };
}

/**
 * Builds the full variant/state/size matrix for a component and combines the
 * resulting ComponentNodes into a real Figma ComponentSet (so the variants are
 * exposed as first-class variant properties in the editor), instead of flat
 * sibling components. Axes with a single value are not exposed as properties.
 */
function buildVariantSet(
  def: ComponentDefinition,
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  varMap: VariableMap,
  parent: FrameNode
): { count: number; primary?: ComponentNode | ComponentSetNode } {
  const tmpl = TEMPLATES[def.name] ?? fallbackTemplate;
  const dv = pickDefault(def.variants, ['default']);
  const ds = pickDefault(def.states, ['default']);
  const dz = pickDefault(def.sizes, ['md', 'default', 'sm']);

  // Each axis must contribute at least one value. 28 of the 50 definitions
  // declare `sizes: []`, and without the length guard the matrix loop below
  // iterates an empty axis, produces zero combos, and drops the component
  // entirely — silently, since nothing is appended and `primary` stays
  // undefined. Falling back to the default keeps the component and simply
  // doesn't expose that axis as a variant property.
  const variantsList = config.options.includeVariants && def.variants.length ? def.variants : [dv];
  const sizesList = config.options.includeVariants && def.sizes.length ? def.sizes : [dz];
  const statesList = config.options.includeStates && def.states.length ? def.states : [ds];

  const useVariantAxis = variantsList.length > 1;
  const useSizeAxis = sizesList.length > 1;
  const useStateAxis = statesList.length > 1;

  const combos: ComponentNode[] = [];
  for (const v of variantsList) {
    for (const sz of sizesList) {
      for (const st of statesList) {
        const node = buildOne(
          def,
          tokens,
          config,
          styleMap,
          tmpl,
          v,
          st,
          sz,
          useVariantAxis ? v.name : undefined,
          useStateAxis ? st.name : undefined,
          useSizeAxis ? sz.name : undefined,
          varMap
        );
        const props: Record<string, string> = {};
        if (useVariantAxis) props['Variant'] = v.name;
        if (useStateAxis) props['State'] = st.name;
        if (useSizeAxis) props['Size'] = sz.name;
        if (Object.keys(props).length > 0) {
          node.name = `${def.name}, ${Object.entries(props)
            .map(([k, val]) => `${k}=${val}`)
            .join(', ')}`;
        }
        combos.push(node);
      }
    }
  }

  let primary: ComponentNode | ComponentSetNode | undefined;
  if (combos.length > 1) {
    primary = figma.combineAsVariants(combos, parent);
  } else if (combos.length === 1) {
    parent.appendChild(combos[0]);
    primary = combos[0];
  }
  return { count: combos.length, primary };
}
