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
import { hexToRgb } from '../../../shared/color-utils';
import { CW, boardShell, createBlackHeroBox, mkDivider } from '../boards';
import { ensureFont } from '../fonts';
import { buildDesignSystemBentoBoard } from './bentoBoard';
import { buildButtonMatrixBoard } from './buttonMatrix';
import { buildInputMatrixBoard } from './inputMatrix';

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
  varMap?: VariableMap,
  showcaseType?: 'variant' | 'size' | 'state'
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
    showcaseType,
  };
  return tmpl(root, ctx);
}

interface ComponentSection {
  title: string;
  nodes: ComponentNode[];
}

function buildComponentShowcase(
  def: ComponentDefinition,
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  varMap?: VariableMap
): { sections: ComponentSection[]; primary: ComponentNode; totalCount: number } {
  const tmpl = TEMPLATES[def.name] ?? fallbackTemplate;
  const dv = pickDefault(def.variants, ['default', 'primary']);
  const ds = pickDefault(def.states, ['default']);
  const dz = pickDefault(def.sizes, ['md', 'default', 'sm']);

  const sections: ComponentSection[] = [];
  let totalCount = 0;

  // 1. Variants (All declared variants at default size & state)
  const variantNodes: ComponentNode[] = [];
  for (const v of def.variants) {
    const node = buildOne(def, tokens, config, styleMap, tmpl, v, ds, dz, v.name, undefined, undefined, varMap, 'variant');
    variantNodes.push(node);
  }
  const primary = variantNodes[0] ?? buildOne(def, tokens, config, styleMap, tmpl, dv, ds, dz, undefined, undefined, undefined, varMap);
  if (variantNodes.length > 0) {
    sections.push({ title: 'Variants', nodes: variantNodes });
    totalCount += variantNodes.length;
  } else {
    sections.push({ title: 'Default', nodes: [primary] });
    totalCount += 1;
  }

  // 2. Sizes (All declared sizes at default variant & state)
  if (config.options.includeVariants && def.sizes.length > 1) {
    const sizeNodes: ComponentNode[] = [];
    for (const sz of def.sizes) {
      sizeNodes.push(buildOne(def, tokens, config, styleMap, tmpl, dv, ds, sz, undefined, undefined, sz.name, varMap, 'size'));
    }
    sections.push({ title: 'Sizes', nodes: sizeNodes });
    totalCount += sizeNodes.length;
  }

  // 3. Interactive States (All declared states at default variant & size)
  if (config.options.includeStates && def.states.length > 1) {
    const stateNodes: ComponentNode[] = [];
    for (const st of def.states) {
      stateNodes.push(buildOne(def, tokens, config, styleMap, tmpl, dv, st, dz, undefined, st.name, undefined, varMap, 'state'));
    }
    sections.push({ title: 'Interactive States', nodes: stateNodes });
    totalCount += stateNodes.length;
  }

  return { sections, primary, totalCount };
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

  // Remove previous category frames so repeated runs update cleanly
  for (const child of [...componentsPage.children]) {
    child.remove();
  }

  const generatedBoards: FrameNode[] = [];

  // 1. Always generate the Design System Bento Master Board (Image 5)
  try {
    const bentoBoard = await buildDesignSystemBentoBoard(tokens, config, styleMap, varMap);
    componentsPage.appendChild(bentoBoard);
    generatedBoards.push(bentoBoard);
  } catch (err) {
    console.error('[design-system-kit] Bento board failed to generate:', err);
  }

  // 2. Generate the 04. Buttons State Matrix Board (Image 4)
  if (config.componentsToGenerate.includes('Button')) {
    try {
      const buttonBoard = await buildButtonMatrixBoard(tokens, config, styleMap, varMap);
      componentsPage.appendChild(buttonBoard);
      generatedBoards.push(buttonBoard);
    } catch (err) {
      console.error('[design-system-kit] Button matrix failed to generate:', err);
    }
  }

  // 3. Generate the 05. Inputs & Form Controls Matrix Board
  if (config.componentsToGenerate.includes('Input') || config.componentsToGenerate.includes('Textarea')) {
    try {
      const inputBoard = await buildInputMatrixBoard(tokens, config, styleMap, varMap);
      componentsPage.appendChild(inputBoard);
      generatedBoards.push(inputBoard);
    } catch (err) {
      console.error('[design-system-kit] Input matrix failed to generate:', err);
    }
  }

  // 4. Generate all remaining component categories in clean boards
  const nonMatrixComponents = selected.filter(
    (d) => !['Button', 'IconButton', 'Input', 'Textarea'].includes(d.name)
  );

  for (const [index, def] of nonMatrixComponents.entries()) {
    let frame = frames[def.category];
    if (!frame) {
      const catLabel = CATEGORY_LABELS[def.category] ?? def.category;
      frame = boardShell(`${catLabel} Library`);
      frame.x = 0;
      frame.y = 0;
      componentsPage.appendChild(frame);
      frames[def.category] = frame;
      generatedBoards.push(frame);

      const hero = await createBlackHeroBox(
        'Components',
        `${catLabel} Library`,
        `Production-ready UI components for ${catLabel.toLowerCase()} styled with active design tokens.`,
        undefined,
        CW,
        config.fontFamily.heading
      );
      frame.appendChild(hero);
      frame.appendChild(mkDivider());
    }
    let primary: ComponentNode | ComponentSetNode | undefined;
    try {
      if (config.options.generateFullVariantSets) {
        const result = buildVariantSet(def, tokens, config, styleMap, varMap, frame);
        count += result.count;
        primary = result.primary;
      } else {
        const sec = figma.createFrame();
        sec.name = `Component ${def.name}`;
        sec.layoutMode = 'VERTICAL';
        sec.primaryAxisSizingMode = 'AUTO';
        sec.counterAxisSizingMode = 'FIXED';
        sec.resize(CW, 100);
        sec.itemSpacing = 0;
        sec.cornerRadius = 16;
        sec.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
        sec.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E8F0') }];
        sec.strokeWeight = 1;
        sec.clipsContent = true;
        sec.effects = [
          {
            type: 'DROP_SHADOW',
            color: { r: 0.05, g: 0.09, b: 0.16, a: 0.04 },
            offset: { x: 0, y: 2 },
            radius: 8,
            spread: 0,
            visible: true,
            blendMode: 'NORMAL',
          },
        ];

        // 1. Integrated Header inside the card with auto-sizing badge
        const cardHead = figma.createFrame();
        cardHead.name = 'Card Header';
        cardHead.layoutMode = 'HORIZONTAL';
        cardHead.primaryAxisSizingMode = 'FIXED';
        cardHead.counterAxisSizingMode = 'AUTO';
        cardHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
        cardHead.counterAxisAlignItems = 'CENTER';
        cardHead.resize(CW, 56);
        cardHead.paddingTop = 14;
        cardHead.paddingBottom = 14;
        cardHead.paddingLeft = 24;
        cardHead.paddingRight = 24;
        cardHead.fills = [{ type: 'SOLID', color: hexToRgb('#F8FAFC') }];
        cardHead.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E8F0') }];
        cardHead.strokeWeight = 1;
        cardHead.strokeAlign = 'INSIDE';

        const titleLeft = figma.createFrame();
        titleLeft.name = 'Title & Badge';
        titleLeft.layoutMode = 'HORIZONTAL';
        titleLeft.counterAxisAlignItems = 'CENTER';
        titleLeft.itemSpacing = 10;
        titleLeft.fills = [];

        const catBadge = figma.createFrame();
        catBadge.name = 'Category Badge';
        catBadge.layoutMode = 'HORIZONTAL';
        catBadge.primaryAxisSizingMode = 'AUTO';
        catBadge.counterAxisSizingMode = 'AUTO';
        catBadge.paddingTop = 3;
        catBadge.paddingBottom = 3;
        catBadge.paddingLeft = 8;
        catBadge.paddingRight = 8;
        catBadge.cornerRadius = 6;
        catBadge.fills = [{ type: 'SOLID', color: hexToRgb('#EFF6FF') }];
        catBadge.strokes = [{ type: 'SOLID', color: hexToRgb('#DBEAFE') }];
        catBadge.strokeWeight = 1;

        const catTxt = figma.createText();
        catTxt.fontName = await ensureFont(config.fontFamily.mono, 600);
        catTxt.fontSize = 11;
        catTxt.characters = (CATEGORY_LABELS[def.category] ?? def.category).toUpperCase();
        catTxt.fills = [{ type: 'SOLID', color: hexToRgb('#2563EB') }];
        catBadge.appendChild(catTxt);
        titleLeft.appendChild(catBadge);

        const compTitle = figma.createText();
        compTitle.fontName = await ensureFont(config.fontFamily.heading, 700);
        compTitle.fontSize = 18;
        compTitle.letterSpacing = { value: -1, unit: 'PERCENT' };
        compTitle.characters = def.name;
        compTitle.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
        titleLeft.appendChild(compTitle);

        cardHead.appendChild(titleLeft);

        // Meta tags on the right
        const metaTxt = figma.createText();
        metaTxt.fontName = await ensureFont(config.fontFamily.body, 500);
        metaTxt.fontSize = 12;
        metaTxt.characters = `${def.variants.length} Variants  •  ${def.sizes.length || 1} Sizes  •  ${def.states.length || 1} States`;
        metaTxt.fills = [{ type: 'SOLID', color: hexToRgb('#64748B') }];
        cardHead.appendChild(metaTxt);

        sec.appendChild(cardHead);

        // 2. Card Content with Sections
        const cardBody = figma.createFrame();
        cardBody.name = 'Card Body';
        cardBody.layoutMode = 'VERTICAL';
        cardBody.primaryAxisSizingMode = 'AUTO';
        cardBody.counterAxisSizingMode = 'FIXED';
        cardBody.resize(CW, 100);
        cardBody.itemSpacing = 28;
        cardBody.paddingTop = 28;
        cardBody.paddingBottom = 32;
        cardBody.paddingLeft = 28;
        cardBody.paddingRight = 28;
        cardBody.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
        cardBody.clipsContent = false;

        const showcase = buildComponentShowcase(def, tokens, config, styleMap, varMap);
        for (const [sIdx, section] of showcase.sections.entries()) {
          if (sIdx > 0) {
            const innerDiv = figma.createFrame();
            innerDiv.name = 'SubDivider';
            innerDiv.resize(CW - 56, 1);
            innerDiv.fills = [{ type: 'SOLID', color: hexToRgb('#F1F5F9') }];
            cardBody.appendChild(innerDiv);
          }

          const groupFrame = figma.createFrame();
          groupFrame.name = section.title;
          groupFrame.layoutMode = 'VERTICAL';
          groupFrame.primaryAxisSizingMode = 'AUTO';
          groupFrame.counterAxisSizingMode = 'FIXED';
          groupFrame.resize(CW - 56, 50);
          groupFrame.itemSpacing = 14;
          groupFrame.fills = [];
          groupFrame.clipsContent = false;

          const groupLabel = figma.createText();
          groupLabel.fontName = await ensureFont(config.fontFamily.mono, 600);
          groupLabel.fontSize = 11;
          groupLabel.letterSpacing = { value: 6, unit: 'PERCENT' };
          groupLabel.characters = section.title.toUpperCase();
          groupLabel.fills = [{ type: 'SOLID', color: hexToRgb('#94A3B8') }];
          groupFrame.appendChild(groupLabel);

          const rowFrame = figma.createFrame();
          rowFrame.name = 'Row';
          rowFrame.layoutMode = 'HORIZONTAL';
          rowFrame.layoutWrap = 'WRAP';
          rowFrame.resize(CW - 56, 40);
          rowFrame.itemSpacing = 24;
          rowFrame.counterAxisSpacing = 24;
          rowFrame.counterAxisAlignItems = 'MIN';
          rowFrame.fills = [];
          rowFrame.clipsContent = false;

          section.nodes.forEach((n) => rowFrame.appendChild(n));
          rowFrame.primaryAxisSizingMode = 'FIXED';
          rowFrame.counterAxisSizingMode = 'AUTO';

          groupFrame.appendChild(rowFrame);
          groupFrame.primaryAxisSizingMode = 'AUTO';
          groupFrame.counterAxisSizingMode = 'FIXED';

          cardBody.appendChild(groupFrame);
        }

        sec.appendChild(cardBody);
        frame.appendChild(sec);
        frame.appendChild(mkDivider());

        count += showcase.totalCount;
        primary = showcase.primary;
      }
    } catch (err) {
      console.error(`[design-system-kit] component "${def.name}" failed to generate:`, err);
    }
    if (primary && !byName.has(def.name)) {
      byName.set(def.name, primary);
    }
    onProgress?.((index + 1) / Math.max(1, selected.length));
    await yieldToUI();
  }

  // Layout all generated boards neatly on the canvas
  let currentY = 0;
  generatedBoards.forEach((f) => {
    f.x = 0;
    f.y = currentY;
    currentY += f.height + 80;
  });

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
    const setNode = figma.combineAsVariants(combos, parent);
    setNode.name = def.name;
    // combineAsVariants leaves the variants absolutely positioned, all at the
    // same coordinates — a 24-variant set arrived as one opaque stack. Auto-
    // layout has to be turned on explicitly, and before layoutWrap, which Figma
    // rejects while layoutMode is NONE.
    setNode.layoutMode = 'HORIZONTAL';
    setNode.layoutWrap = 'WRAP';
    setNode.itemSpacing = 32;
    setNode.counterAxisSpacing = 32;
    setNode.paddingTop = 32;
    setNode.paddingRight = 32;
    setNode.paddingBottom = 32;
    setNode.paddingLeft = 32;
    primary = setNode;
  } else if (only) {
    parent.appendChild(only);
    primary = only;
  }
  return { count: combos.length, primary };
}
