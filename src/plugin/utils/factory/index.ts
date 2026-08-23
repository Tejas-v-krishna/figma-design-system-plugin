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
import { yieldToUI } from '../yield';

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

// ComponentVariant, ComponentState and ComponentSize are structurally the same
// shape, so one non-generic parameter type covers all three call sites. The
// previous `<T extends PropSet>` needed an `as T` cast to build its empty
// fallback, because T could in principle carry required fields the fallback
// lacked. Nothing was ever instantiated that way.
interface PropSet {
  name: string;
  properties: Record<string, string | number | boolean>;
}

const EMPTY_PROP_SET: PropSet = { name: 'Default', properties: {} };

/** First entry matching a preferred name, else the first entry, else a stub. */
function pickDefault(arr: PropSet[], prefs: string[]): PropSet {
  for (const p of prefs) {
    const f = arr.find((a) => a.name.toLowerCase() === p);
    if (f) return f;
  }
  return arr[0] ?? EMPTY_PROP_SET;
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

export async function generateComponents(
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  componentsPage: PageNode,
  onProgress?: (fraction: number) => void,
  varMap: VariableMap = emptyVariableMap()
): Promise<{ count: number; byName: Map<string, ComponentNode | ComponentSetNode> }> {
  const selected = COMPONENT_DEFINITIONS.filter((d) => config.componentsToGenerate.includes(d.name));
  const frames: Record<string, FrameNode> = {};
  const byName = new Map<string, ComponentNode | ComponentSetNode>();
  let count = 0;

  for (const [index, def] of selected.entries()) {
    // Looked up and created in one step. Reading it back out of the record
    // afterwards left `frame` typed as possibly missing for the rest of the
    // loop, which is the one thing it definitely is not.
    let frame = frames[def.category];
    if (!frame) {
      frame = figma.createFrame();
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
    // `count` is a running total of *variants* built, and `selected.length` is a
    // count of *components*. Dividing one by the other gave a fraction well past
    // 1 as soon as any component produced more than one variant — the caller
    // scales it into a percentage, so the bar shot past 100 and the numbers the
    // user saw were nonsense. It is the component index that is out of a total.
    onProgress?.((index + 1) / Math.max(1, selected.length));

    // Building a full variant matrix is the longest uninterrupted stretch of work
    // the plugin does. Without a yield here the whole loop runs as one blocking
    // task: every progress message sits in the queue until it finishes, so the
    // bar froze at the starting value and Figma stopped responding for the
    // duration. Per component rather than per variant — a yield costs a frame,
    // and one per variant would be slower than not yielding at all.
    await yieldToUI();
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
  const only = combos[0];
  if (combos.length > 1) {
    primary = figma.combineAsVariants(combos, parent);
  } else if (only) {
    parent.appendChild(only);
    primary = only;
  }
  return { count: combos.length, primary };
}
