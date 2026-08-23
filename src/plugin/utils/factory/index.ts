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
import { CW, PAD, boardShell, createBlackHeroBox, mkDivider } from '../boards';
import { ensureFont } from '../fonts';

const CATEGORY_LABELS: Record<string, string> = {
  buttons: 'Buttons & Actions',
  inputs: 'Inputs & Form Controls',
  forms: 'Forms & Pickers',
  cards: 'Cards & Containers',
  feedback: 'Feedback & Status',
  navigation: 'Navigation',
  'data-display': 'Data Display',
  overlays: 'Overlays & Modals',
  media: 'Media',
  typography: 'Typography',
};

const CATEGORY_SUBTITLES: Record<string, string> = {
  buttons: 'Production-ready interactive buttons, icon buttons, and segmented control groups.',
  inputs: 'Text fields, textareas, search bars, and selection controls with full interactive states.',
  forms: 'Date pickers, time pickers, color pickers, and multi-step form widgets.',
  cards: 'Content containers, profile cards, and modular bento layout cards.',
  feedback: 'Alert banners, badges, tags, toast notifications, and progress indicators.',
  navigation: 'Tabs, breadcrumbs, pagination, and navigation bars.',
  'data-display': 'Data tables, stat cards, avatars, tooltips, and popovers.',
  overlays: 'Dialog modals, slide-over drawers, and interactive bottom sheets.',
  media: 'Image containers, media cards, and icon assets.',
  typography: 'Headings, body copy, captions, and code blocks.',
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
  showcaseType?: 'variant' | 'size' | 'state' | 'icon'
): ComponentNode {
  const name = formatComponentName(def.category, def.name, vLabel, sLabel, szLabel, DEFAULT_NAMING);
  const root = makeComponent(name);
  try {
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
  } catch (err) {
    console.error(`[design-system-kit] template error for ${name}:`, err);
    root.resize(120, 36);
    root.cornerRadius = 6;
    return root;
  }
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

  const hasMatrix = def.variants.length > 1 && def.states.length > 1;

  if (hasMatrix) {
    const statesToUse = def.states.filter((s) => ['Default', 'Hover', 'Focus', 'Active', 'Disabled', 'Checked', 'Unchecked'].includes(s.name));
    const states = statesToUse.length > 0 ? statesToUse : def.states;

    for (const v of def.variants) {
      const rowNodes: ComponentNode[] = [];
      for (const st of states) {
        const node = buildOne(def, tokens, config, styleMap, tmpl, v, st, dz, v.name, st.name, undefined, varMap, 'state');
        rowNodes.push(node);
      }
      sections.push({ title: v.name, nodes: rowNodes });
      totalCount += rowNodes.length;
    }

    // Sizes Scale
    if (def.sizes.length > 1) {
      const sizeNodes: ComponentNode[] = [];
      for (const sz of def.sizes) {
        sizeNodes.push(buildOne(def, tokens, config, styleMap, tmpl, dv, ds, sz, undefined, undefined, sz.name, varMap, 'size'));
      }
      sections.push({ title: 'Sizes Scale', nodes: sizeNodes });
      totalCount += sizeNodes.length;
    }

    // Icons & Contextual Actions for Button
    if (def.name === 'Button') {
      const iconDefs = [
        { label: 'Create New', iconType: 'leading', variant: 'primary', caption: 'Leading Icon' },
        { label: 'Continue', iconType: 'trailing', variant: 'primary', caption: 'Trailing Icon' },
        { label: 'Star', iconType: 'badge', variant: 'secondary', caption: 'Badge Counter' },
        { label: 'Docs', iconType: 'external', variant: 'ghost', caption: 'External Link' },
        { label: 'Copy Link', iconType: 'copy', variant: 'secondary', caption: 'Copy Action' },
        { label: 'Copied!', iconType: 'copied', variant: 'tonal', caption: 'Copied State' },
        { label: 'Saving…', iconType: 'loading', variant: 'primary', caption: 'Async Loading' },
      ];

      const iconNodes: ComponentNode[] = [];
      for (const ic of iconDefs) {
        const v = def.variants.find((x) => x.name.toLowerCase() === ic.variant) ?? dv;
        const vProps = { ...v.properties, iconType: ic.iconType, customLabel: ic.label };
        const customVariant = { name: ic.caption, properties: vProps };
        const node = buildOne(def, tokens, config, styleMap, tmpl, customVariant, ds, dz, ic.caption, undefined, undefined, varMap, 'icon');
        iconNodes.push(node);
      }
      sections.push({ title: 'Icons & Contextual', nodes: iconNodes });
      totalCount += iconNodes.length;
    }

    const primary = sections[0]?.nodes[0] ?? buildOne(def, tokens, config, styleMap, tmpl, dv, ds, dz, undefined, undefined, undefined, varMap);
    return { sections, primary, totalCount };
  }

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
    sections.push({ title: 'Sizes Scale', nodes: sizeNodes });
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
  const rawList =
    config.componentsToGenerate.length > 0
      ? config.componentsToGenerate
      : COMPONENT_DEFINITIONS.map((c) => c.name);
  const selected = COMPONENT_DEFINITIONS.filter((d) => rawList.includes(d.name));
  const frames: Record<string, FrameNode> = {};
  const byName = new Map<string, ComponentNode | ComponentSetNode>();
  let count = 0;

  // Remove previous category frames so repeated runs update cleanly
  for (const child of [...componentsPage.children]) {
    child.remove();
  }

  const generatedBoards: FrameNode[] = [];
  const BOARD_WIDTH = CW + PAD * 2;
  const BOARD_GAP = 160;

  for (const [index, def] of selected.entries()) {
    let frame = frames[def.category];
    if (!frame) {
      const catLabel = CATEGORY_LABELS[def.category] ?? def.category;
      const catSub = CATEGORY_SUBTITLES[def.category] ?? `Production-ready UI components for ${catLabel.toLowerCase()} styled with active design tokens.`;

      frame = boardShell(catLabel);
      frame.x = generatedBoards.length * (BOARD_WIDTH + BOARD_GAP);
      frame.y = 0;
      componentsPage.appendChild(frame);
      frames[def.category] = frame;
      generatedBoards.push(frame);

      const hero = await createBlackHeroBox(
        'Components',
        catLabel,
        catSub,
        undefined,
        CW,
        'Google Sans'
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
        sec.cornerRadius = 24;
        sec.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
        sec.strokes = [{ type: 'SOLID', color: hexToRgb('#E4E4E7') }];
        sec.strokeWeight = 1;
        sec.clipsContent = true;
        sec.effects = [
          {
            type: 'DROP_SHADOW',
            color: { r: 0.05, g: 0.07, b: 0.1, a: 0.03 },
            offset: { x: 0, y: 1 },
            radius: 3,
            spread: 0,
            visible: true,
            blendMode: 'NORMAL',
          },
          {
            type: 'DROP_SHADOW',
            color: { r: 0.05, g: 0.07, b: 0.1, a: 0.05 },
            offset: { x: 0, y: 12 },
            radius: 32,
            spread: -6,
            visible: true,
            blendMode: 'NORMAL',
          },
        ];

        // 1. Studio Header inside the card with pill category and micro spec chips
        const cardHead = figma.createFrame();
        cardHead.name = 'Card Header';
        cardHead.layoutMode = 'HORIZONTAL';
        cardHead.primaryAxisSizingMode = 'FIXED';
        cardHead.counterAxisSizingMode = 'AUTO';
        cardHead.primaryAxisAlignItems = 'SPACE_BETWEEN';
        cardHead.counterAxisAlignItems = 'CENTER';
        cardHead.resize(CW, 68);
        cardHead.paddingTop = 18;
        cardHead.paddingBottom = 18;
        cardHead.paddingLeft = 36;
        cardHead.paddingRight = 36;
        cardHead.fills = [{ type: 'SOLID', color: hexToRgb('#FAFAFA') }];
        cardHead.strokes = [{ type: 'SOLID', color: hexToRgb('#F4F4F5') }];
        cardHead.strokeWeight = 1;
        cardHead.strokeAlign = 'INSIDE';

        const titleLeft = figma.createFrame();
        titleLeft.name = 'Title & Badge';
        titleLeft.layoutMode = 'HORIZONTAL';
        titleLeft.counterAxisAlignItems = 'CENTER';
        titleLeft.itemSpacing = 14;
        titleLeft.fills = [];

        const catBadge = figma.createFrame();
        catBadge.name = 'Category Badge';
        catBadge.layoutMode = 'HORIZONTAL';
        catBadge.primaryAxisSizingMode = 'AUTO';
        catBadge.counterAxisSizingMode = 'AUTO';
        catBadge.paddingTop = 4;
        catBadge.paddingBottom = 4;
        catBadge.paddingLeft = 10;
        catBadge.paddingRight = 10;
        catBadge.cornerRadius = 9999;
        catBadge.fills = [{ type: 'SOLID', color: hexToRgb('#F4F4F5') }];
        catBadge.strokes = [{ type: 'SOLID', color: hexToRgb('#E4E4E7') }];
        catBadge.strokeWeight = 1;

        const catTxt = figma.createText();
        catTxt.fontName = await ensureFont(config.fontFamily.body, 600);
        catTxt.fontSize = 11;
        catTxt.characters = (CATEGORY_LABELS[def.category] ?? def.category).toUpperCase();
        catTxt.fills = [{ type: 'SOLID', color: hexToRgb('#52525B') }];
        catBadge.appendChild(catTxt);
        titleLeft.appendChild(catBadge);

        const compTitle = figma.createText();
        compTitle.fontName = await ensureFont(config.fontFamily.heading, 700);
        compTitle.fontSize = 20;
        compTitle.letterSpacing = { value: -1, unit: 'PERCENT' };
        compTitle.characters = def.name;
        compTitle.fills = [{ type: 'SOLID', color: hexToRgb('#18181B') }];
        titleLeft.appendChild(compTitle);

        cardHead.appendChild(titleLeft);

        // Spec chips on the right
        const metaRight = figma.createFrame();
        metaRight.name = 'Spec Badges';
        metaRight.layoutMode = 'HORIZONTAL';
        metaRight.counterAxisAlignItems = 'CENTER';
        metaRight.itemSpacing = 8;
        metaRight.fills = [];

        const specLabels = [
          `${def.variants.length} Variants`,
          `${def.sizes.length || 1} Sizes`,
          `${def.states.length || 1} States`,
        ];

        for (const sText of specLabels) {
          const chip = figma.createFrame();
          chip.name = 'SpecChip';
          chip.layoutMode = 'HORIZONTAL';
          chip.primaryAxisSizingMode = 'AUTO';
          chip.counterAxisSizingMode = 'AUTO';
          chip.counterAxisAlignItems = 'CENTER';
          chip.cornerRadius = 9999;
          chip.paddingTop = 4;
          chip.paddingBottom = 4;
          chip.paddingLeft = 10;
          chip.paddingRight = 10;
          chip.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
          chip.strokes = [{ type: 'SOLID', color: hexToRgb('#E4E4E7') }];
          chip.strokeWeight = 1;

          const chipText = figma.createText();
          chipText.fontName = await ensureFont(config.fontFamily.body, 500);
          chipText.fontSize = 11;
          chipText.characters = sText;
          chipText.fills = [{ type: 'SOLID', color: hexToRgb('#71717A') }];
          chip.appendChild(chipText);
          metaRight.appendChild(chip);
        }

        cardHead.appendChild(metaRight);
        sec.appendChild(cardHead);

        // 2. Card Content with Sections
        const cardBody = figma.createFrame();
        cardBody.name = 'Card Body';
        cardBody.layoutMode = 'VERTICAL';
        cardBody.primaryAxisSizingMode = 'AUTO';
        cardBody.counterAxisSizingMode = 'FIXED';
        cardBody.resize(CW, 100);
        cardBody.itemSpacing = 32;
        cardBody.paddingTop = 40;
        cardBody.paddingBottom = 44;
        cardBody.paddingLeft = 40;
        cardBody.paddingRight = 40;
        cardBody.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
        cardBody.clipsContent = false;

        const showcase = buildComponentShowcase(def, tokens, config, styleMap, varMap);
        for (const [sIdx, section] of showcase.sections.entries()) {
          const isSpecialNonMatrix = ['Sizes Scale', 'Sizes', 'Icons & Contextual', 'Contextual', 'Variants', 'Interactive States', 'Default'].includes(section.title);
          const isMatrixRow = !isSpecialNonMatrix;

          if (sIdx > 0 && !isMatrixRow) {
            const innerDiv = figma.createFrame();
            innerDiv.name = 'SubDivider';
            innerDiv.resize(CW - 80, 1);
            innerDiv.fills = [{ type: 'SOLID', color: hexToRgb('#F4F4F5') }];
            cardBody.appendChild(innerDiv);
          }

          if (isMatrixRow) {
            // Horizontal row with left label and right state buttons matching the studio style
            const rowLine = figma.createFrame();
            rowLine.name = `Row ${section.title}`;
            rowLine.layoutMode = 'HORIZONTAL';
            rowLine.primaryAxisAlignItems = 'MIN';
            rowLine.counterAxisAlignItems = 'CENTER';
            rowLine.itemSpacing = 36;
            rowLine.fills = [];
            rowLine.clipsContent = false;
            rowLine.resize(CW - 80, 44);

            const rowLabel = figma.createText();
            rowLabel.fontName = await ensureFont(config.fontFamily.body, 600);
            rowLabel.fontSize = 13;
            rowLabel.characters = section.title;
            rowLabel.fills = [{ type: 'SOLID', color: hexToRgb('#3F3F46') }];
            rowLabel.resize(100, 20);
            rowLabel.textAlignHorizontal = 'RIGHT';
            rowLine.appendChild(rowLabel);

            const buttonsContainer = figma.createFrame();
            buttonsContainer.name = 'Buttons';
            buttonsContainer.layoutMode = 'HORIZONTAL';
            buttonsContainer.primaryAxisAlignItems = 'MIN';
            buttonsContainer.counterAxisAlignItems = 'CENTER';
            buttonsContainer.itemSpacing = 28;
            buttonsContainer.fills = [];
            buttonsContainer.clipsContent = false;

            for (const n of section.nodes) {
              buttonsContainer.appendChild(n);
            }

            rowLine.appendChild(buttonsContainer);
            cardBody.appendChild(rowLine);
            continue;
          }

          const groupFrame = figma.createFrame();
          groupFrame.name = section.title;
          groupFrame.layoutMode = 'VERTICAL';
          groupFrame.primaryAxisSizingMode = 'AUTO';
          groupFrame.counterAxisSizingMode = 'FIXED';
          groupFrame.resize(CW - 80, 50);
          groupFrame.itemSpacing = 20;
          groupFrame.fills = [];
          groupFrame.clipsContent = false;

          const groupHeader = figma.createFrame();
          groupHeader.name = 'GroupHeader';
          groupHeader.layoutMode = 'HORIZONTAL';
          groupHeader.counterAxisAlignItems = 'CENTER';
          groupHeader.itemSpacing = 10;
          groupHeader.fills = [];

          const accentPill = figma.createFrame();
          accentPill.name = 'Accent';
          accentPill.resize(3, 14);
          accentPill.cornerRadius = 9999;
          accentPill.fills = [{ type: 'SOLID', color: hexToRgb('#18181B') }];
          groupHeader.appendChild(accentPill);

          const groupLabel = figma.createText();
          groupLabel.fontName = await ensureFont(config.fontFamily.body, 700);
          groupLabel.fontSize = 12;
          groupLabel.letterSpacing = { value: 6, unit: 'PERCENT' };
          groupLabel.characters = section.title.toUpperCase();
          groupLabel.fills = [{ type: 'SOLID', color: hexToRgb('#18181B') }];
          groupHeader.appendChild(groupLabel);

          let subtitle = '';
          if (section.title === 'Sizes Scale') {
            subtitle = 'Proportional scale from XS (28px) to XL (56px)';
          } else if (section.title === 'Sizes') {
            subtitle = 'Proportional scale across available dimensions';
          } else if (section.title === 'Icons & Contextual') {
            subtitle = 'Adornments, counter badges & async feedback';
          } else if (section.title === 'Variants') {
            subtitle = 'Visual styles and semantic color themes';
          } else if (section.title === 'Interactive States') {
            subtitle = 'Default, hover, focus, active, and disabled feedback';
          }

          if (subtitle) {
            const subLabel = figma.createText();
            subLabel.fontName = await ensureFont(config.fontFamily.body, 400);
            subLabel.fontSize = 12;
            subLabel.characters = subtitle;
            subLabel.fills = [{ type: 'SOLID', color: hexToRgb('#A1A1AA') }];
            groupHeader.appendChild(subLabel);
          }

          groupFrame.appendChild(groupHeader);

          const rowFrame = figma.createFrame();
          rowFrame.name = 'Row';
          rowFrame.layoutMode = 'HORIZONTAL';
          rowFrame.layoutWrap = 'WRAP';
          rowFrame.resize(CW - 80, 40);
          rowFrame.itemSpacing = 24;
          rowFrame.counterAxisSpacing = 20;
          rowFrame.counterAxisAlignItems = 'MAX';
          rowFrame.fills = [];
          rowFrame.clipsContent = false;

          for (const n of section.nodes) {
            const cell = figma.createFrame();
            const rawLabel = n.name.split('/').pop() || 'Default';
            cell.name = `Specimen ${rawLabel}`;
            cell.layoutMode = 'VERTICAL';
            cell.primaryAxisSizingMode = 'AUTO';
            cell.counterAxisSizingMode = 'AUTO';
            cell.primaryAxisAlignItems = 'MAX';
            cell.counterAxisAlignItems = 'CENTER';
            cell.itemSpacing = 8;
            cell.paddingTop = 4;
            cell.paddingBottom = 4;
            cell.paddingLeft = 4;
            cell.paddingRight = 4;
            cell.fills = [];
            cell.clipsContent = false;
            cell.appendChild(n);

            const propLabel = figma.createText();
            propLabel.fontName = await ensureFont(config.fontFamily.body, 500);
            propLabel.fontSize = 12;
            propLabel.characters = rawLabel;
            propLabel.fills = [{ type: 'SOLID', color: hexToRgb('#71717A') }];
            cell.appendChild(propLabel);

            rowFrame.appendChild(cell);
          }

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

  // Ensure all category boards are cleanly positioned side-by-side with zero overlap
  generatedBoards.forEach((f, idx) => {
    f.x = idx * (BOARD_WIDTH + BOARD_GAP);
    f.y = 0;
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
