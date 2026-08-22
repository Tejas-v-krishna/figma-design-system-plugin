// FIGR Design System - Generation command
// Builds tokens -> styles -> pages -> components from a GenerationConfig.
import {
  DesignTokens,
  GenerationConfig,
  GenerationStats,
  GenerationProgress,
} from '../../shared/types';
import { COMPONENT_DEFINITIONS } from '../../shared/component-definitions';
import { generateSemanticColors, hexToRgb, generateColorShades, generateGradientsForColor } from '../../shared/color-utils';
import { fetchColorName } from '../../shared/color-naming';
import { GradientPreset } from '../../shared/types';
import {
  generateTypographyTokens,
  generateSpacingTokens,
  generateShadowTokens,
  generateBorderRadiusTokens,
  generateStrokeTokens,
} from '../../shared/typography-utils';
import { resolveFont, preloadFonts, ensureFont } from '../utils/fonts';
import {
  colorStyleKey,
  textStyleKey,
  effectStyleKey,
  semanticColorKey,
  emptyStyleMap,
  StyleMap,
} from '../utils/styleKeys';
import { makeFrame, setFill, setStroke, setEffect, hbox, vbox, text, rect, pad } from '../utils/primitives';
import { colorShade, radiusPx, shadow } from '../utils/tokenAccess';
import { setLastTokens } from '../utils/tokensStore';
import { generateComponents } from '../utils/factory';
import { createVariables, VariableMap, emptyVariableMap } from '../utils/variables';
import { BoardContext, TOKEN_BOARD_BUILDERS, TokenBoardTarget, isTokenBoardTarget } from '../utils/boards';

export type { GenerationProgress };

export async function generateDesignSystem(
  config: GenerationConfig & { target?: string },
  onProgress?: (progress: GenerationProgress) => void
): Promise<{ stats: GenerationStats }> {
  const update = (step: GenerationProgress['step'], progress: number, message: string) =>
    onProgress?.({ step, progress, message });

  update('initializing', 5, 'Initializing generation…');

  await preloadFonts(config);
  update('loading-fonts', 15, 'Fonts loaded');

  const tokens = buildTokens(config);
  update('generating-tokens', 25, 'Tokens built');

  const styleMap = config.options.createStyles ? createStyles(tokens, config) : emptyStyleMap();
  const varMap: VariableMap = config.options.createVariables ? createVariables(tokens, config) : emptyVariableMap();

  const targetMode = config.target || 'all';

  // Isolated target mode handling (e.g. clicking 'Create colors variables in ❖' ONLY generates colors)
  if (targetMode === 'colors') {
    update('creating-pages', 50, 'Building Color System page…');
    let colorPage = figma.root.children.find((p) => p.name === '🎨 Color System') || figma.createPage();
    colorPage.name = '🎨 Color System';
    await figma.setCurrentPageAsync(colorPage);

    // Clear previous elements on Color System page
    for (const child of [...colorPage.children]) {
      child.remove();
    }

    await buildColorSystemBoard(colorPage, tokens, config, styleMap, varMap);
    update('complete', 100, 'Color System generated successfully!');
    setLastTokens(tokens, config);
    return {
      stats: {
        tokensCreated: Object.keys(styleMap.color).length,
        stylesCreated: Object.keys(styleMap.color).length,
        variablesCreated: 0,
        componentsCreated: 0,
        pagesCreated: 1,
      },
    };
  }

  if (targetMode === 'components') {
    update('creating-pages', 50, 'Generating Components page…');
    let compPage = figma.root.children.find((p) => p.name === '🧩 Components') || figma.createPage();
    compPage.name = '🧩 Components';
    await figma.setCurrentPageAsync(compPage);

    const { count: componentsCreated } = generateComponents(
      tokens,
      config,
      styleMap,
      compPage,
      (fraction) => update('generating-components', 50 + Math.round(fraction * 45), 'Generating components…'),
      varMap
    );

    update('complete', 100, 'Components generated successfully!');
    setLastTokens(tokens, config);
    return {
      stats: {
        tokensCreated: 0,
        stylesCreated: 0,
        variablesCreated: 0,
        componentsCreated,
        pagesCreated: 1,
      },
    };
  }

  // Every remaining token category maps to exactly one board. Before this,
  // `typography`, `spacing`, `radius`, `stroke` and `effects` all fell through
  // to the full five-page rebuild below — so "Create radius variables in Figma"
  // silently regenerated the entire design system.
  if (isTokenBoardTarget(targetMode)) {
    const label = TOKEN_BOARD_LABELS[targetMode];
    update('creating-pages', 50, `Building ${label} board…`);

    const tokensPage = await openPage('🎨 Tokens');
    const board = await TOKEN_BOARD_BUILDERS[targetMode]({ tokens, config, styleMap, varMap });

    // Replace this category's previous board rather than stacking duplicates,
    // then drop the fresh one below whatever else is already on the page.
    replaceBoard(tokensPage, board);

    figma.viewport.scrollAndZoomIntoView([board]);
    update('complete', 100, `${label} tokens generated successfully!`);
    setLastTokens(tokens, config);
    return { stats: boardStats(targetMode, tokens, styleMap, varMap) };
  }

  // `gradients` is derived from the brand colour rather than from a token
  // array, so it routes to the colour-derived board instead of TOKEN_BOARDS.
  if (targetMode === 'gradients') {
    update('creating-pages', 50, 'Building Gradients board…');

    const colorPage = await openPage('🎨 Color System');
    const cleanHex = config.primaryColor.replace('#', '').toUpperCase();
    const name = config.colorNames?.[cleanHex] || (await fetchColorName(config.primaryColor)) || `#${cleanHex}`;
    const board = await buildGradientsBoard(config.primaryColor, name, `${name} Gradients Board`);
    replaceBoard(colorPage, board);

    figma.viewport.scrollAndZoomIntoView([board]);
    update('complete', 100, 'Gradients generated successfully!');
    setLastTokens(tokens, config);
    return {
      stats: {
        tokensCreated: generateGradientsForColor(config.primaryColor).length,
        stylesCreated: 0,
        variablesCreated: 0,
        componentsCreated: 0,
        pagesCreated: 1,
      },
    };
  }

  // Default / All mode
  if (!config.componentsToGenerate || config.componentsToGenerate.length === 0) {    config.componentsToGenerate = COMPONENT_DEFINITIONS.map((c) => c.name);
  }

  const pages = createPages();
  update('creating-pages', 50, 'Pages created');

  await figma.setCurrentPageAsync(pages.components);
  const { count: componentsCreated, byName: componentsByName } = generateComponents(
    tokens,
    config,
    styleMap,
    pages.components,
    (fraction) => update('generating-components', 50 + Math.round(fraction * 35), 'Generating components…'),
    varMap
  );

  const safePage = async (page: PageNode, label: string, build: () => Promise<void> | void) => {
    await figma.setCurrentPageAsync(page);
    try {
      await build();
    } catch (err) {
      console.error(`[figr] page "${label}" failed to generate:`, err);
    }
  };

  await safePage(pages.tokens, 'Tokens', async () => await createTokensPage(pages.tokens, tokens, config, styleMap, varMap));
  await safePage(pages.patterns, 'Patterns', () => createPatternsPage(pages.patterns, tokens, config, styleMap, varMap));
  await safePage(pages.docs, 'Documentation', () => createDocumentationPage(pages.docs, config));
  await safePage(pages.playground, 'Playground', () =>
    createPlaygroundPage(pages.playground, tokens, config, styleMap, varMap, componentsByName)
  );
  update('organizing', 92, 'Finalizing…');

  setLastTokens(tokens, config);
  await figma.setCurrentPageAsync(pages.components);

  const stylesCreated = Object.keys(styleMap.color).length + Object.keys(styleMap.text).length + Object.keys(styleMap.effect).length;
  const variablesCreated =
    Object.keys(varMap.primitive).length + Object.keys(varMap.semantic).length + Object.keys(varMap.component).length;
  const tokensCreated = stylesCreated + variablesCreated;

  update('complete', 100, 'Design system generated successfully!');
  return {
    stats: {
      tokensCreated,
      stylesCreated,
      variablesCreated,
      componentsCreated,
      pagesCreated: 5,
    },
  };
}

// ---------------- tokens ----------------

/**
 * Derive the full token set from a config. Pure — no Figma API calls — so the
 * export command can rebuild tokens from the UI's config when nothing has been
 * generated in this plugin session yet.
 */
export function buildTokens(config: GenerationConfig): DesignTokens {
  const colors = generateSemanticColors({
    primary: config.primaryColor,
    secondary: config.secondaryColor,
    accent: config.accentColor,
    success: config.successColor,
    error: config.errorColor,
    warning: config.warningColor,
    information: config.informationColor,
    neutral: config.neutralColor,
  });

  let typography = generateTypographyTokens(config.fontFamily.body, config.baseFontSize, config.typographyScale);
  // Headings use the heading typeface.
  typography = typography.map((t) =>
    t.group === 'headings' ? { ...t, fontFamily: config.fontFamily.heading } : t
  );

  let borderRadius = generateBorderRadiusTokens();
  if (config.radiusPreset === 'sharp') {
    borderRadius = borderRadius.map((r) => (r.name === 'none' ? r : { ...r, px: 0, value: '0px' }));
  } else if (config.radiusPreset === 'pill') {
    borderRadius = borderRadius.map((r) => (r.name === 'none' ? r : { ...r, px: 9999, value: '9999px' }));
  }

  const intensityMap: Record<string, string[]> = {
    none: [],
    subtle: ['E0', 'E1'],
    medium: ['E0', 'E1', 'E2', 'E3'],
    strong: generateShadowTokens().map((s) => s.name),
  };
  const allowed = intensityMap[config.effectsIntensity] ?? intensityMap.medium;
  const shadows = generateShadowTokens().filter((s) => allowed.includes(s.name));

  const spacing = generateSpacingTokens(config.baseSpacing);
  const strokes = generateStrokeTokens();

  return { colors, typography, spacing, shadows, borderRadius, strokes };
}

// ---------------- fonts ----------------

// Font preloading is handled by preloadFonts() in ../utils/fonts, which resolves
// each requested (family, weight) to an actually-installed style before loading.

// ---------------- styles ----------------

function createStyles(tokens: DesignTokens, config: GenerationConfig): StyleMap {
  const map = emptyStyleMap();

  for (const [colorName, ct] of Object.entries(tokens.colors)) {
    for (const [shade, hex] of Object.entries(ct.shades)) {
      const key = colorStyleKey(colorName, shade);
      const style = figma.createPaintStyle();
      style.name = key;
      style.paints = [{ type: 'SOLID', color: hexToRgb(hex) }];
      map.color[key] = style.id;
    }
    if (config.options.includeDarkMode && ct.darkShades) {
      for (const [shade, hex] of Object.entries(ct.darkShades)) {
        const key = `${colorStyleKey(colorName, shade)}/Dark`;
        const style = figma.createPaintStyle();
        style.name = key;
        style.paints = [{ type: 'SOLID', color: hexToRgb(hex) }];
        map.color[key] = style.id;
      }
    }
  }

  for (const t of tokens.typography) {
    const key = textStyleKey(t.name);
    const style = figma.createTextStyle();
    style.name = key;
    style.fontName = resolveFont(t.fontFamily, t.fontWeight);
    style.fontSize = t.fontSize;
    style.lineHeight = { value: t.lineHeight, unit: 'PIXELS' };
    if (t.letterSpacing) style.letterSpacing = { value: t.letterSpacing, unit: 'PERCENT' };
    if (t.underline) style.textDecoration = 'UNDERLINE';
    map.text[key] = style.id;
  }

  for (const s of tokens.shadows) {
    const key = effectStyleKey(s.name);
    const style = figma.createEffectStyle();
    style.name = key;
    style.effects = [
      {
        type: 'DROP_SHADOW',
        offset: { x: s.x, y: s.y },
        radius: s.blur,
        spread: s.spread,
        color: parseRgba(s.color),
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
    map.effect[key] = style.id;
  }

  return map;
}

// ---------------- pages ----------------

interface Pages {
  tokens: PageNode;
  components: PageNode;
  patterns: PageNode;
  docs: PageNode;
  playground: PageNode;
}

function createPages(): Pages {
  const tokensPage = figma.createPage();
  tokensPage.name = '🎨 Tokens';

  const componentsPage = figma.createPage();
  componentsPage.name = '🧩 Components';

  const patternsPage = figma.createPage();
  patternsPage.name = '📐 Patterns';

  const docsPage = figma.createPage();
  docsPage.name = '📚 Documentation';

  const playgroundPage = figma.createPage();
  playgroundPage.name = '🎮 Playground';

  return {
    tokens: tokensPage,
    components: componentsPage,
    patterns: patternsPage,
    docs: docsPage,
    playground: playgroundPage,
  };
}

async function sectionTitle(parent: FrameNode, text: string, fontFamily: string): Promise<void> {
  const t = figma.createText();
  t.fontName = await ensureFont(fontFamily, 700);
  t.fontSize = 22;
  t.characters = text;
  t.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
  parent.appendChild(t);
}



function isLightColorHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance > 170;
}


async function createBlackHeroBox(
  badgeText: string,
  titleText: string,
  mainDesc?: string,
  descItems?: { label: string; desc: string }[],
  width: number = 904
): Promise<FrameNode> {
  const box = figma.createFrame();
  box.name = 'Header Black Box';
  box.layoutMode = 'VERTICAL';
  box.primaryAxisSizingMode = 'AUTO';
  box.counterAxisSizingMode = 'FIXED';
  box.resize(width, 100);
  box.paddingTop = 28;
  box.paddingBottom = 28;
  box.paddingLeft = 36;
  box.paddingRight = 36;
  box.itemSpacing = 14;
  box.cornerRadius = 16;
  box.fills = [{ type: 'SOLID', color: hexToRgb('#0B0C10') }];
  box.clipsContent = true;

  // 1. Badge (e.g. "Tokens")
  if (badgeText) {
    const badge = figma.createFrame();
    badge.name = 'Badge';
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.paddingTop = 4;
    badge.paddingBottom = 4;
    badge.paddingLeft = 12;
    badge.paddingRight = 12;
    badge.cornerRadius = 100;
    // Figma's RGB has no alpha channel — translucency goes on the paint's
    // `opacity`, not inside `color`. Passing `a` there is silently ignored,
    // which rendered this badge fully opaque instead of a subtle 5% wash.
    badge.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.05 }];
    badge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
    badge.strokeWeight = 1;

    const badgeTxt = figma.createText();
    badgeTxt.fontName = await ensureFont('Google Sans', 500);
    badgeTxt.fontSize = 11;
    badgeTxt.characters = badgeText;
    badgeTxt.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    badge.appendChild(badgeTxt);
    box.appendChild(badge);
  }

  // 2. Title (e.g. "Color System")
  const title = figma.createText();
  title.name = 'Title';
  title.fontName = await ensureFont('Google Sans', 700);
  title.fontSize = 36;
  title.letterSpacing = { value: -2, unit: 'PERCENT' };
  title.characters = titleText;
  title.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  box.appendChild(title);

  // 3. Main Intro Description
  if (mainDesc) {
    const mainDescTxt = figma.createText();
    mainDescTxt.name = 'Main Description';
    mainDescTxt.fontName = await ensureFont('Google Sans', 400);
    mainDescTxt.fontSize = 13;
    mainDescTxt.characters = mainDesc;
    mainDescTxt.fills = [{ type: 'SOLID', color: hexToRgb('#CBD5E1') }];
    mainDescTxt.textAutoResize = 'HEIGHT';
    mainDescTxt.resize(width - 72, mainDescTxt.height);
    box.appendChild(mainDescTxt);
  }

  // 4. Detailed Component Descriptions
  if (descItems && descItems.length > 0) {
    const listFrame = figma.createFrame();
    listFrame.name = 'Color Descriptions';
    listFrame.layoutMode = 'VERTICAL';
    listFrame.primaryAxisSizingMode = 'AUTO';
    listFrame.counterAxisSizingMode = 'FIXED';
    listFrame.resize(width - 72, 100);
    listFrame.itemSpacing = 8;
    listFrame.fills = [];

    for (const item of descItems) {
      const row = figma.createFrame();
      row.name = item.label;
      row.layoutMode = 'HORIZONTAL';
      row.primaryAxisSizingMode = 'FIXED';
      row.counterAxisSizingMode = 'AUTO';
      row.resize(width - 72, 20);
      row.itemSpacing = 4;
      row.counterAxisAlignItems = 'MIN';
      row.fills = [];

      const lbl = figma.createText();
      lbl.fontName = await ensureFont('Google Sans', 700);
      lbl.fontSize = 12;
      lbl.characters = `${item.label} : `;
      lbl.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];

      const body = figma.createText();
      body.fontName = await ensureFont('Google Sans', 400);
      body.fontSize = 12;
      body.characters = item.desc;
      body.fills = [{ type: 'SOLID', color: hexToRgb('#94A3B8') }];
      body.textAutoResize = 'HEIGHT';
      body.resize(width - 72 - 140, body.height);

      row.appendChild(lbl);
      row.appendChild(body);
      listFrame.appendChild(row);
    }
    box.appendChild(listFrame);
  }

  return box;
}

async function buildColorSystemBoard(
  page: PageNode,
  tokens: DesignTokens,
  config: GenerationConfig,
  _styleMap: StyleMap,
  _varMap: VariableMap
): Promise<void> {
  for (const child of [...page.children]) {
    if (child.name === 'Color System Board') child.remove();
  }

  // ── constants ─────────────────────────────────────────────────
  const CW  = 904;  // content width (5 × 176 + 4 × 6 = 904)
  const PAD = 56;
  const SH  = 116;  // swatch height
  const SW  = 176;  // swatch width
  const SG  = 6;    // gap between swatches

  const C_DARK   = hexToRgb('#0F172A');
  const C_MED    = hexToRgb('#334155');
  const C_MUTED  = hexToRgb('#64748B');
  const C_LIGHT  = hexToRgb('#94A3B8');
  const C_BORDER = hexToRgb('#E2E8F0');

  const primShades = generateColorShades(tokens.colors.primary.hex);
  const secShades  = generateColorShades(tokens.colors.secondary?.hex || config.secondaryColor || '#F97316');
  const accShades  = generateColorShades(tokens.colors.accent?.hex || config.accentColor || '#8B5CF6');
  const neutShades = generateColorShades(tokens.colors.neutral.hex);
  const sucShades  = generateColorShades(tokens.colors.success.hex);
  const wrnShades  = generateColorShades(tokens.colors.warning.hex);
  const errShades  = generateColorShades(tokens.colors.error.hex);
  const infShades  = generateColorShades(tokens.colors.information.hex);

  // ── helpers ───────────────────────────────────────────────────
  const mkTxt = async (
    chars: string, wt: number, sz: number, col: RGB, ls = 0
  ): Promise<TextNode> => {
    const t = figma.createText();
    t.fontName = await ensureFont('Google Sans', wt);
    t.fontSize = sz;
    t.characters = chars;
    t.fills = [{ type: 'SOLID', color: col }];
    if (ls) t.letterSpacing = { value: ls, unit: 'PERCENT' };
    return t;
  };

  const mkFrame = (
    name: string, dir: 'VERTICAL' | 'HORIZONTAL', gap = 0
  ): FrameNode => {
    const f = figma.createFrame();
    f.name = name;
    f.layoutMode = dir;
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
    f.counterAxisAlignItems = 'MIN';
    f.fills = [];
    f.itemSpacing = gap;
    return f;
  };

  const mkDivider = (): FrameNode => {
    const d = figma.createFrame();
    d.name = 'Divider';
    d.resize(CW, 1);
    d.fills = [{ type: 'SOLID', color: C_BORDER }];
    return d;
  };

  // ── single swatch ─────────────────────────────────────────────
  const mkSwatch = async (
    hex: string, shade: number, isMain: boolean
  ): Promise<FrameNode> => {
    const sw = figma.createFrame();
    sw.name = String(shade);
    sw.resize(SW, SH);
    sw.layoutMode = 'VERTICAL';
    sw.primaryAxisSizingMode = 'FIXED';
    sw.counterAxisSizingMode = 'FIXED';
    sw.primaryAxisAlignItems = 'SPACE_BETWEEN';
    sw.counterAxisAlignItems = 'MIN';
    sw.paddingTop = 12;    sw.paddingBottom = 12;
    sw.paddingLeft = 14;   sw.paddingRight = 14;
    sw.cornerRadius = 10;
    sw.clipsContent = true;
    sw.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];

    const light = isLightColorHex(hex);
    const hi = light ? hexToRgb('#0F172A') : hexToRgb('#FFFFFF');
    const lo = light ? hexToRgb('#475569') : hexToRgb('#CBD5E1');

    const top = mkFrame('Top', 'VERTICAL', 3);
    top.appendChild(await mkTxt(String(shade), isMain ? 700 : 500, isMain ? 18 : 13, hi));
    if (isMain) top.appendChild(await mkTxt('Main color', 400, 11, lo));
    sw.appendChild(top);
    sw.appendChild(await mkTxt(hex.toUpperCase(), 400, 10, lo));
    return sw;
  };

  // ── 5-stop horizontal scale row ───────────────────────────────
  const mkScale = async (
    name: string,
    shades: Record<number, string>,
    stops: number[]
  ): Promise<FrameNode> => {
    const r = mkFrame(name, 'HORIZONTAL', SG);
    for (const s of stops) {
      r.appendChild(await mkSwatch(shades[s] ?? '#EEEEEE', s, s === 500));
    }
    return r;
  };

  // ── full color section block (label + title + scale + desc) ──
  const mkColorBlock = async (
    catLabel: string,
    colorName: string,
    shades: Record<number, string>,
    stops: number[],
    desc: string,
    rules: { lbl: string; rule: string }[]
  ): Promise<FrameNode> => {
    const blk = mkFrame(colorName, 'VERTICAL', 14);

    blk.appendChild(await mkTxt(catLabel, 400, 12, C_LIGHT));
    blk.appendChild(await mkTxt(colorName, 700, 26, C_DARK, -2));
    blk.appendChild(await mkScale(colorName, shades, stops));

    const dr = mkFrame('DescRow', 'HORIZONTAL', 48);
    dr.paddingTop = 8;

    const descCol = mkFrame('Desc', 'VERTICAL', 6);
    descCol.appendChild(await mkTxt('Description & Usage', 600, 13, C_DARK));
    const descBody = await mkTxt(desc, 400, 13, C_MUTED);
    descBody.textAutoResize = 'HEIGHT';
    descBody.resize(400, descBody.height);
    descCol.appendChild(descBody);
    dr.appendChild(descCol);

    if (rules.length) {
      const rc = mkFrame('Rules', 'VERTICAL', 8);
      rc.appendChild(await mkTxt('Rules', 600, 13, C_DARK));
      for (const { lbl, rule } of rules) {
        const rr = mkFrame('Rule', 'HORIZONTAL', 10);
        rr.appendChild(await mkTxt(lbl, 600, 12, C_MED));
        const rt = await mkTxt(rule, 400, 12, C_MUTED);
        rt.textAutoResize = 'HEIGHT';
        rt.resize(260, rt.height);
        rr.appendChild(rt);
        rc.appendChild(rr);
      }
      dr.appendChild(rc);
    }

    blk.appendChild(dr);
    return blk;
  };

  // ── section heading (small label + large title) ───────────────
  const mkSecHead = async (label: string, title: string): Promise<FrameNode> => {
    const h = figma.createFrame();
    h.name = `SecHead - ${title}`;
    h.layoutMode = 'VERTICAL';
    h.primaryAxisSizingMode = 'AUTO';
    h.counterAxisSizingMode = 'FIXED';
    h.resize(CW, 76);
    h.paddingTop = 16;
    h.paddingBottom = 16;
    h.paddingLeft = 24;
    h.paddingRight = 24;
    h.itemSpacing = 4;
    h.cornerRadius = 14;
    h.clipsContent = true;

    h.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        gradientStops: [
          { position: 0, color: { r: 0.91, g: 0.93, b: 0.96, a: 1 } },
          { position: 1, color: { r: 0.97, g: 0.98, b: 1, a: 0.25 } },
        ],
      },
    ];
    h.strokes = [{ type: 'SOLID', color: { r: 0.89, g: 0.91, b: 0.94 } }];
    h.strokeWeight = 1;

    h.appendChild(await mkTxt(label.toUpperCase(), 600, 11, C_MUTED, 6));
    h.appendChild(await mkTxt(title, 700, 24, C_DARK, -2));
    return h;
  };

  // ════════════════════════════════════════════════════════════
  //  OUTER BOARD
  // ════════════════════════════════════════════════════════════
  const board = mkFrame('Color System Board', 'VERTICAL', 48);
  board.paddingTop = PAD;  board.paddingBottom = PAD;
  board.paddingLeft = PAD; board.paddingRight = PAD;
  board.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  board.cornerRadius = 20;
  board.clipsContent = false;
  board.effects = [{
    type: 'DROP_SHADOW',
    color: { r: 0, g: 0, b: 0, a: 0.06 },
    offset: { x: 0, y: 8 },
    radius: 32, spread: 0,
    visible: true, blendMode: 'NORMAL',
  }];
  page.appendChild(board);

  // ── BOARD HEADER ──────────────────────────────────────────────
  const heroHeader = await createBlackHeroBox(
    'Tokens',
    'Color System',
    'A color palette is simply a set of colors that work well together, combined to form a brand or a concept.',
    [
      {
        label: 'Primary colors',
        desc: "Your brand color defines the interface's feel and elicits emotion, used consistently across interactive elements.",
      },
      {
        label: 'Neutral colors',
        desc: 'Gray is foundational in UI design, used for text, form fields, backgrounds, and dividers.',
      },
      {
        label: 'Accent colors',
        desc: 'Secondary to the primary color, these grab attention and support brand identity in components like labels.',
      },
      {
        label: 'Feedback colors',
        desc: 'Highlight semantic states to provide visual feedback and warnings during interface use.',
      },
    ],
    CW
  );
  board.appendChild(heroHeader);
  board.appendChild(mkDivider());

  // ── SECTION 1 – PRIMITIVE BASE COLORS ────────────────────────
  {
    const sec = mkFrame('Primitive Colors', 'VERTICAL', 40);
    sec.appendChild(await mkSecHead('Primitive Colors', 'Base Colors'));
    sec.appendChild(mkDivider());

    const primName =
      config.colorNames?.[tokens.colors.primary.hex.replace('#', '').toUpperCase()] || 'Brand';
    const secHex = tokens.colors.secondary?.hex || config.secondaryColor || '#F97316';
    const secName =
      config.colorNames?.[secHex.replace('#', '').toUpperCase()] || 'Secondary';
    const accHex = tokens.colors.accent?.hex || config.accentColor || '#8B5CF6';
    const accName =
      config.colorNames?.[accHex.replace('#', '').toUpperCase()] || 'Accent';

    sec.appendChild(await mkColorBlock(
      'Base color / Brand color',
      `Primary · ${primName}`,
      primShades as unknown as Record<number, string>,
      [100, 300, 500, 700, 900],
      'This is the leading brand color used everywhere — shapes, socials, physical products, and prints. It is a base color for most interactive components and the primary product color.',
      [
        { lbl: '900–700', rule: 'Only for headlines or tiny texts when high contrast is required.' },
        { lbl: '500', rule: 'Main color used mostly for interactive components, texts and products.' },
        { lbl: '300–100', rule: 'Tint and background uses only. Don\'t use for body text.' },
      ]
    ));

    sec.appendChild(mkDivider());

    sec.appendChild(await mkColorBlock(
      'Base color / Secondary color',
      `Secondary · ${secName}`,
      secShades as unknown as Record<number, string>,
      [100, 300, 500, 700, 900],
      'Secondary brand accent color used to highlight key interactive elements, badges, and secondary calls-to-action.',
      [
        { lbl: '900–700', rule: 'For secondary active states and high emphasis borders.' },
        { lbl: '500', rule: 'Main secondary accent color for badges and highlights.' },
        { lbl: '300–100', rule: 'Subtle secondary background tints and container fills.' },
      ]
    ));

    sec.appendChild(mkDivider());

    sec.appendChild(await mkColorBlock(
      'Base color / Accent color',
      `Accent · ${accName}`,
      accShades as unknown as Record<number, string>,
      [100, 300, 500, 700, 900],
      'Supporting accent color used for special badges, subtle highlights, and creative visual accents across the UI.',
      [
        { lbl: '900–700', rule: 'For high-emphasis accent details and dark mode highlights.' },
        { lbl: '500', rule: 'Main accent color for icons, indicators, and focused elements.' },
        { lbl: '300–100', rule: 'Light accent fills and tag backgrounds.' },
      ]
    ));

    sec.appendChild(mkDivider());

    sec.appendChild(await mkColorBlock(
      'Base color',
      'Grayscale',
      neutShades as unknown as Record<number, string>,
      [100, 300, 500, 700, 900],
      'Grayscale palette. Lightly tinted with the brand hue to feel cohesive. Used for text, borders, surfaces and backgrounds across the entire system.',
      [
        { lbl: '900–700', rule: 'For dark text and high-emphasis surfaces.' },
        { lbl: '500–300', rule: 'For secondary text, icons, and borders.' },
        { lbl: '100', rule: 'For subtle background fills.' },
      ]
    ));

    board.appendChild(sec);
  }
  board.appendChild(mkDivider());

  // ── SECTION 2 – SEMANTIC COLORS ──────────────────────────────
  {
    const sec = mkFrame('Semantic Colors', 'VERTICAL', 36);
    sec.appendChild(await mkSecHead('Semantic Colors', 'Status & Feedback Colors'));
    sec.appendChild(mkDivider());

    const semList: {
      name: string;
      shades: Record<number, string>;
      desc: string;
      rules: { lbl: string; rule: string }[];
    }[] = [
      {
        name: 'Success',
        shades: sucShades as unknown as Record<number, string>,
        desc: 'Communicates positive outcomes, confirmations, and completed actions.',
        rules: [
          { lbl: '900–700', rule: 'Success text on light backgrounds.' },
          { lbl: '500', rule: 'Icons, badges and interactive states.' },
          { lbl: '300–100', rule: 'Alert and toast backgrounds.' },
        ],
      },
      {
        name: 'Warning',
        shades: wrnShades as unknown as Record<number, string>,
        desc: 'Communicates caution, attention-required states, and advisories.',
        rules: [
          { lbl: '900–700', rule: 'Warning text on light backgrounds.' },
          { lbl: '500', rule: 'Caution icons and badges.' },
          { lbl: '300–100', rule: 'Warning notification backgrounds.' },
        ],
      },
      {
        name: 'Error',
        shades: errShades as unknown as Record<number, string>,
        desc: 'Communicates errors, destructive actions, and critical failures.',
        rules: [
          { lbl: '900–700', rule: 'Error text and destructive action labels.' },
          { lbl: '500', rule: 'Error icons and form field outlines.' },
          { lbl: '300–100', rule: 'Error message backgrounds.' },
        ],
      },
      {
        name: 'Information',
        shades: infShades as unknown as Record<number, string>,
        desc: 'Communicates informational notices, hints, and neutral announcements.',
        rules: [
          { lbl: '900–700', rule: 'Info text and emphasized notices.' },
          { lbl: '500', rule: 'Info icons and indicators.' },
          { lbl: '300–100', rule: 'Info banner and tooltip backgrounds.' },
        ],
      },
    ];

    for (const sc of semList) {
      sec.appendChild(await mkColorBlock(
        'Semantic color',
        sc.name,
        sc.shades,
        [100, 300, 500, 700, 900],
        sc.desc,
        sc.rules
      ));
      sec.appendChild(mkDivider());
    }

    board.appendChild(sec);
  }

  // ── SECTION 3 – TEXT COLORS ───────────────────────────────────
  {
    const sec = mkFrame('Text Colors', 'VERTICAL', 24);
    sec.appendChild(await mkSecHead('Functional Tokens', 'Text Colors'));
    sec.appendChild(mkDivider());

    const textSwatches = [
      { label: 'Black Text',      hex: (neutShades as unknown as Record<number,string>)[900] },
      { label: 'Description',     hex: (neutShades as unknown as Record<number,string>)[600] },
      { label: 'Additional Text', hex: (neutShades as unknown as Record<number,string>)[400] },
      { label: 'Disabled',        hex: (neutShades as unknown as Record<number,string>)[200] },
      { label: 'White Text',      hex: '#FFFFFF' },
    ];

    const row = mkFrame('TextRow', 'HORIZONTAL', 8);
    for (const ts of textSwatches) {
      const card = figma.createFrame();
      card.name = ts.label;
      card.resize(170, 140);
      card.layoutMode = 'VERTICAL';
      card.primaryAxisSizingMode = 'FIXED';
      card.counterAxisSizingMode = 'FIXED';
      card.primaryAxisAlignItems = 'MIN';
      card.paddingTop = 14;  card.paddingBottom = 14;
      card.paddingLeft = 14; card.paddingRight = 14;
      card.itemSpacing = 8;
      card.cornerRadius = 10;
      card.fills = [{ type: 'SOLID', color: hexToRgb(ts.hex) }];
      if (ts.hex === '#FFFFFF') {
        card.strokes = [{ type: 'SOLID', color: C_BORDER }];
        card.strokeWeight = 1;
      }
      const light = isLightColorHex(ts.hex);
      const hi = light ? hexToRgb('#0F172A') : hexToRgb('#FFFFFF');
      const lo = light ? hexToRgb('#64748B') : hexToRgb('#CBD5E1');
      card.appendChild(await mkTxt(ts.label, 600, 13, hi));
      card.appendChild(await mkTxt(ts.hex.toUpperCase(), 400, 11, lo));
      row.appendChild(card);
    }

    sec.appendChild(row);
    board.appendChild(sec);
    board.appendChild(mkDivider());
  }

  // ── SECTION 4 – BACKGROUND TOKENS ────────────────────────────
  {
    const sec = mkFrame('Background Colors', 'VERTICAL', 24);
    sec.appendChild(await mkSecHead('Functional Tokens', 'Background & Surface Colors'));
    sec.appendChild(mkDivider());

    const bgSwatches = [
      { label: 'bg-base',     hex: '#FFFFFF',                                                    token: 'neutral-0' },
      { label: 'bg-surface',  hex: (neutShades as unknown as Record<number,string>)[50],         token: 'neutral-50' },
      { label: 'bg-elevated', hex: '#FFFFFF',                                                    token: 'neutral-0 + shadow' },
      { label: 'bg-inset',    hex: (neutShades as unknown as Record<number,string>)[100],        token: 'neutral-100' },
      { label: 'bg-overlay',  hex: (neutShades as unknown as Record<number,string>)[900],        token: 'neutral-900' },
    ];

    const row = mkFrame('BgRow', 'HORIZONTAL', 8);
    for (const bg of bgSwatches) {
      const card = figma.createFrame();
      card.name = bg.label;
      card.resize(170, 160);
      card.layoutMode = 'VERTICAL';
      card.primaryAxisSizingMode = 'FIXED';
      card.counterAxisSizingMode = 'FIXED';
      card.primaryAxisAlignItems = 'MIN';
      card.paddingTop = 14;  card.paddingBottom = 14;
      card.paddingLeft = 14; card.paddingRight = 14;
      card.itemSpacing = 6;
      card.cornerRadius = 10;
      card.fills = [{ type: 'SOLID', color: hexToRgb(bg.hex) }];
      card.strokes = [{ type: 'SOLID', color: C_BORDER }];
      card.strokeWeight = 1;
      const light = isLightColorHex(bg.hex);
      const hi = light ? hexToRgb('#0F172A') : hexToRgb('#FFFFFF');
      const lo = light ? hexToRgb('#64748B') : hexToRgb('#CBD5E1');
      card.appendChild(await mkTxt(bg.label, 600, 12, hi));
      card.appendChild(await mkTxt(bg.token, 400, 10, lo));
      row.appendChild(card);
    }

    sec.appendChild(row);
    board.appendChild(sec);
  }
}

async function createTokensPage(page: PageNode, tokens: DesignTokens, config: GenerationConfig, styleMap: StyleMap, varMap: VariableMap): Promise<void> {
  await buildColorSystemBoard(page, tokens, config, styleMap, varMap);

  const foundations = figma.createFrame();
  foundations.name = 'Foundations';
  foundations.layoutMode = 'VERTICAL';
  foundations.primaryAxisSizingMode = 'AUTO';
  foundations.counterAxisSizingMode = 'AUTO';
  foundations.itemSpacing = 60;
  foundations.fills = [];
  foundations.clipsContent = false;
  // Sits below whatever the colour board actually produced. The previous
  // hardcoded y = 1200 overlapped it as soon as the palette grew.
  foundations.y = bottomOf(page) + 80;
  page.appendChild(foundations);

  // Same builders the per-category buttons use, so a single "Create spacing
  // variables" run and a full generate produce identical boards.
  const ctx: BoardContext = { tokens, config, styleMap, varMap };
  for (const target of TOKEN_BOARD_ORDER) {
    if (target === 'effects' && !tokens.shadows.length) continue;
    foundations.appendChild(await TOKEN_BOARD_BUILDERS[target](ctx));
  }
}

/** Bottom edge of the lowest node on a page, or 0 when it's empty. */
function bottomOf(page: PageNode): number {
  return page.children.reduce((max, node) => Math.max(max, node.y + node.height), 0);
}

const TOKEN_BOARD_ORDER: TokenBoardTarget[] = ['typography', 'spacing', 'radius', 'stroke', 'effects'];

const TOKEN_BOARD_LABELS: Record<TokenBoardTarget, string> = {
  typography: 'Typography',
  spacing: 'Spacing',
  radius: 'Border radius',
  stroke: 'Stroke',
  effects: 'Elevation',
};

/** Find an existing page by name or create it, then make it current. */
async function openPage(name: string): Promise<PageNode> {
  const page = figma.root.children.find((p) => p.name === name) || figma.createPage();
  page.name = name;
  await figma.setCurrentPageAsync(page);
  return page;
}

/**
 * Put `board` on `page`, replacing any earlier board of the same name so
 * repeated runs update in place instead of piling up copies. Boards are keyed
 * by name, which is why every builder names its frame deterministically.
 */
function replaceBoard(page: PageNode, board: FrameNode): void {
  for (const child of [...page.children]) {
    if (child.name === board.name) child.remove();
  }
  const bottom = bottomOf(page);
  board.x = 0;
  board.y = bottom === 0 ? 0 : bottom + 60;
  page.appendChild(board);
}

/** Stats for a single-category run: only that category's styles count. */
function boardStats(
  target: TokenBoardTarget,
  tokens: DesignTokens,
  styleMap: StyleMap,
  varMap: VariableMap
): GenerationStats {
  const stylesCreated =
    target === 'typography'
      ? Object.keys(styleMap.text).length
      : target === 'effects'
        ? Object.keys(styleMap.effect).length
        : 0;
  const variablesCreated = Object.keys(varMap.primitive).filter((key) => key.startsWith(target)).length;
  const drawn: Record<TokenBoardTarget, number> = {
    typography: tokens.typography.length,
    spacing: tokens.spacing.length,
    radius: tokens.borderRadius.length,
    stroke: tokens.strokes.length,
    effects: tokens.shadows.length,
  };
  return {
    tokensCreated: drawn[target],
    stylesCreated,
    variablesCreated,
    componentsCreated: 0,
    pagesCreated: 1,
  };
}

function createPatternsPage(page: PageNode, tokens: DesignTokens, config: GenerationConfig, styleMap: StyleMap, varMap: VariableMap): void {
  const root = figma.createFrame();
  root.name = 'Patterns';
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 48;
  root.paddingTop = 60;
  root.paddingLeft = 60;
  root.fills = [];
  root.clipsContent = false;
  page.appendChild(root);

  // Sign-in card pattern
  const card = figma.createFrame();
  card.name = 'Sign In';
  card.layoutMode = 'VERTICAL';
  card.itemSpacing = 14;
  card.paddingTop = card.paddingBottom = 28;
  card.paddingLeft = card.paddingRight = 24;
  card.cornerRadius = 12;
  setFill(card, '#FFFFFF', semanticColorKey('Surface/Raised'), styleMap, varMap);
  setStroke(card, tokens.colors.neutral.shades['200'], 1, semanticColorKey('Border/Default'), styleMap, varMap);
  card.resize(300, 360);
  const title = figma.createText();
  title.fontName = resolveFont(config.fontFamily.heading, 700);
  title.fontSize = 22; title.characters = 'Sign in'; title.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
  card.appendChild(title);
  const field = figma.createFrame();
  field.name = 'Field'; field.layoutMode = 'HORIZONTAL'; field.primaryAxisAlignItems = 'CENTER'; field.counterAxisAlignItems = 'CENTER';
  field.paddingLeft = field.paddingRight = 12; field.paddingTop = field.paddingBottom = 10; field.cornerRadius = 8;
  setFill(field, '#FFFFFF', semanticColorKey('Surface/Default'), styleMap, varMap);
  setStroke(field, tokens.colors.neutral.shades['300'], 1, semanticColorKey('Border/Default'), styleMap, varMap); field.resize(252, 40);
  const ph = figma.createText(); ph.fontName = resolveFont(config.fontFamily.body, 400); ph.fontSize = 14; ph.characters = 'Email'; ph.fills = [{ type: 'SOLID', color: hexToRgb(tokens.colors.neutral.shades['400']) }];
  field.appendChild(ph); card.appendChild(field);
  const btn = figma.createFrame();
  btn.name = 'Submit'; btn.layoutMode = 'HORIZONTAL'; btn.primaryAxisAlignItems = 'CENTER'; btn.counterAxisAlignItems = 'CENTER';
  btn.paddingLeft = btn.paddingRight = 16; btn.paddingTop = btn.paddingBottom = 10; btn.cornerRadius = 8;
  setFill(btn, tokens.colors.primary.shades['500'], 'Button/Background/Default', styleMap, varMap);
  btn.resize(252, 40);
  const bl = figma.createText(); bl.fontName = resolveFont(config.fontFamily.body, 600); bl.fontSize = 14; bl.characters = 'Continue'; bl.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  btn.appendChild(bl); card.appendChild(btn);
  root.appendChild(card);

  // Stats row pattern
  const stats = figma.createFrame();
  stats.name = 'Stats'; stats.layoutMode = 'HORIZONTAL'; stats.itemSpacing = 16; stats.fills = []; stats.clipsContent = false;
  ['Users', 'Revenue', 'Growth'].forEach((label, i) => {
    const s = figma.createFrame(); s.name = label; s.layoutMode = 'VERTICAL'; s.itemSpacing = 4; s.paddingTop = s.paddingBottom = 16; s.paddingLeft = s.paddingRight = 20;
    s.cornerRadius = 12; s.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }]; s.strokes = [{ type: 'SOLID', color: hexToRgb(tokens.colors.neutral.shades['200']) }]; s.strokeWeight = 1; s.resize(140, 90);
    const v = figma.createText(); v.fontName = resolveFont(config.fontFamily.heading, 700); v.fontSize = 24; v.characters = ['12.4k', '$84k', '+18%'][i]; v.fills = [{ type: 'SOLID', color: hexToRgb(tokens.colors.primary.shades['600']) }]; s.appendChild(v);
    const l = figma.createText(); l.fontName = resolveFont(config.fontFamily.body, 400); l.fontSize = 12; l.characters = label; l.fills = [{ type: 'SOLID', color: hexToRgb(tokens.colors.neutral.shades['500']) }]; s.appendChild(l);
    stats.appendChild(s);
  });
  root.appendChild(stats);
}

function createDocumentationPage(page: PageNode, config: GenerationConfig): void {
  const root = figma.createFrame();
  root.name = 'Guidelines';
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 16;
  root.paddingTop = 60; root.paddingLeft = 60;
  root.fills = [];
  root.clipsContent = false;
  page.appendChild(root);

  const add = (text: string, size: number, weight: number) => {
    const t = figma.createText();
    t.fontName = resolveFont(config.fontFamily.heading, weight);
    t.fontSize = size; t.characters = text; t.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
    root.appendChild(t);
    return t;
  };
  add(config.brandName, 32, 700);
  add('Design System Documentation', 18, 600);
  add(`Primary: ${config.primaryColor}   Neutral: ${config.neutralColor ?? '#64748B'}`, 14, 400);
  add(`Heading font: ${config.fontFamily.heading}   Body font: ${config.fontFamily.body}`, 14, 400);
  add('Components are organized by category and linked to the generated color, text, and effect styles.', 13, 400);
  if (config.options.createVariables) {
    add(
      `Color tokens are also published as a 3-tier Figma Variables system — Primitives → Semantic → Components — in "${config.brandName} / Primitives", "${config.brandName} / Semantic", and "${config.brandName} / Components"${config.options.includeDarkMode ? ' (Light + Dark modes).' : '.'}`,
      13,
      400
    );
  }
  if (config.options.generateFullVariantSets) {
    add('Components are emitted as full Figma variant sets (Variant / State / Size properties).', 13, 400);
  }
}

function createPlaygroundPage(
  page: PageNode,
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap: StyleMap,
  varMap: VariableMap,
  byName: Map<string, ComponentNode | ComponentSetNode>
): void {
  const root = makeFrame('Playground');
  root.name = 'Playground';
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 48;
  root.paddingTop = 60;
  root.paddingLeft = 60;
  root.fills = [];
  root.clipsContent = false;
  page.appendChild(root);

  sectionTitle(root, 'Playground', config.fontFamily.heading);
  const sub = figma.createText();
  sub.fontName = resolveFont(config.fontFamily.body, 400);
  sub.fontSize = 14;
  sub.characters = 'Interactive examples composed from your tokens and the generated components.';
  sub.fills = [{ type: 'SOLID', color: hexToRgb('#64748B') }];
  sub.textAutoResize = 'WIDTH_AND_HEIGHT';
  root.appendChild(sub);

  const instance = (name: string): InstanceNode | undefined => {
    const node = byName.get(name);
    if (!node) return undefined;
    try {
      // Variant sets expose instances through their default variant.
      if (node.type === 'COMPONENT_SET') return node.defaultVariant.createInstance();
      return node.createInstance();
    } catch {
      return undefined;
    }
  };

  // ---- Sample App: a small dashboard built from tokens + components ----
  const app = makeFrame('Sample App');
  app.layoutMode = 'VERTICAL';
  app.itemSpacing = 0;
  app.cornerRadius = radiusPx(tokens, 'xl');
  app.clipsContent = true;
  setFill(app, '#FFFFFF', semanticColorKey('Surface/Default'), styleMap, varMap);
  setStroke(app, tokens.colors.neutral.shades['200'], 1, semanticColorKey('Border/Default'), styleMap, varMap);
  setEffect(app, shadow(tokens, 'lg'), effectStyleKey('lg'), styleMap);
  app.resize(720, 540);

  // Top navigation bar
  const nav = makeFrame('Nav');
  nav.layoutMode = 'HORIZONTAL';
  nav.primaryAxisAlignItems = 'SPACE_BETWEEN';
  nav.counterAxisAlignItems = 'CENTER';
  nav.paddingLeft = nav.paddingRight = 20;
  nav.paddingTop = nav.paddingBottom = 12;
  setFill(nav, tokens.colors.primary.shades['600'], semanticColorKey('Primary'), styleMap, varMap);
  nav.appendChild(text({ characters: config.brandName, fontFamily: config.fontFamily.heading, weight: 700, fontSize: 16, fill: '#FFFFFF' }));
  const navItems = hbox('nav-items');
  navItems.itemSpacing = 16;
  ['Home', 'Products', 'Docs'].forEach((t) => {
    navItems.appendChild(text({ characters: t, fontFamily: config.fontFamily.body, weight: 500, fontSize: 13, fill: '#E2E8F0' }));
  });
  nav.appendChild(navItems);
  const navAvatar = instance('Avatar');
  if (navAvatar) nav.appendChild(navAvatar);
  app.appendChild(nav);

  // Body: sidebar + main content
  const body = makeFrame('Body');
  body.layoutMode = 'HORIZONTAL';
  body.itemSpacing = 0;
  body.fills = [];

  const sidebar = makeFrame('Sidebar');
  sidebar.layoutMode = 'VERTICAL';
  sidebar.itemSpacing = 6;
  pad(sidebar, 16, 12);
  setFill(sidebar, tokens.colors.neutral.shades['50'], semanticColorKey('Surface/Subtle'), styleMap, varMap);
  sidebar.resize(170, 460);
  ['Dashboard', 'Orders', 'Customers', 'Settings'].forEach((t, i) => {
    const item = makeFrame(`side-${i}`);
    item.layoutMode = 'HORIZONTAL';
    item.counterAxisAlignItems = 'CENTER';
    pad(item, 8, 10);
    item.cornerRadius = radiusPx(tokens, 'sm');
    if (i === 0) setFill(item, tokens.colors.primary.shades['50'], colorStyleKey('primary', '50'), styleMap);
    item.appendChild(text({
      characters: t,
      fontFamily: config.fontFamily.body,
      weight: i === 0 ? 600 : 400,
      fontSize: 13,
      fill: i === 0 ? tokens.colors.primary.shades['700'] : tokens.colors.neutral.shades['700'],
    }));
    sidebar.appendChild(item);
  });
  body.appendChild(sidebar);

  const main = makeFrame('Main');
  main.layoutMode = 'VERTICAL';
  main.itemSpacing = 16;
  pad(main, 20);
  setFill(main, '#F8FAFC', semanticColorKey('Surface/Subtle'), styleMap, varMap);
  main.resize(550, 460);

  // Stat cards
  const stats = makeFrame('Stats');
  stats.layoutMode = 'HORIZONTAL';
  stats.itemSpacing = 12;
  stats.fills = [];
  ['$48.2k', '1,204', '+12%'].forEach((v, i) => {
    const c = vbox(`stat-${i}`);
    c.itemSpacing = 4;
    pad(c, 14, 16);
    c.cornerRadius = radiusPx(tokens, 'md');
    setFill(c, '#FFFFFF', semanticColorKey('Surface/Raised'), styleMap, varMap);
    setStroke(c, tokens.colors.neutral.shades['200'], 1, semanticColorKey('Border/Default'), styleMap, varMap);
    c.appendChild(text({ characters: v, fontFamily: config.fontFamily.heading, weight: 700, fontSize: 20, fill: tokens.colors.primary.shades['600'] }));
    c.appendChild(text({ characters: ['Revenue', 'Orders', 'Growth'][i], fontFamily: config.fontFamily.body, weight: 400, fontSize: 12, fill: tokens.colors.neutral.shades['500'] }));
    stats.appendChild(c);
  });
  main.appendChild(stats);

  // A generated Card component in context
  const cardInst = instance('Card');
  if (cardInst) { main.appendChild(cardInst); cardInst.layoutAlign = 'STRETCH'; }

  // A search field + action buttons
  const inputInst = instance('Input');
  if (inputInst) { main.appendChild(inputInst); inputInst.layoutAlign = 'STRETCH'; }
  const btnRow = hbox('Buttons');
  btnRow.itemSpacing = 12;
  const b1 = instance('Button');
  const b2 = instance('Button');
  if (b1) btnRow.appendChild(b1);
  if (b2) btnRow.appendChild(b2);
  if (btnRow.children.length) main.appendChild(btnRow);

  // A tiny placeholder chart
  const chart = makeFrame('Chart');
  chart.layoutMode = 'HORIZONTAL';
  chart.primaryAxisAlignItems = 'MAX';
  chart.counterAxisAlignItems = 'MIN';
  chart.itemSpacing = 8;
  chart.paddingTop = 8;
  chart.fills = [];
  [40, 70, 55, 90, 65, 100, 80].forEach((h, i) => {
    const bar = rect(`bar-${i}`, 22, h, colorShade(tokens, 'primary', 300 + (i % 3) * 100));
    bar.cornerRadius = 4;
    chart.appendChild(bar);
  });
  main.appendChild(chart);

  body.appendChild(main);
  app.appendChild(body);
  root.appendChild(app);

  // ---- Component Showcase: a live gallery of generated components ----
  const SHOWCASE = ['Button', 'IconButton', 'Input', 'Select', 'Checkbox', 'Switch', 'Card', 'Badge', 'Alert', 'Avatar', 'Tabs', 'Pagination', 'Progress', 'Tag', 'Rating', 'Slider', 'Tooltip'];
  const perRow = 6;
  const showcase = makeFrame('Component Showcase');
  showcase.layoutMode = 'VERTICAL';
  showcase.itemSpacing = 16;
  showcase.fills = [];
  for (let i = 0; i < SHOWCASE.length; i += perRow) {
    const row = makeFrame(`row-${i / perRow}`);
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisAlignItems = 'MIN';
    row.counterAxisAlignItems = 'MIN';
    row.itemSpacing = 16;
    row.fills = [];
    row.clipsContent = false;
    for (const name of SHOWCASE.slice(i, i + perRow)) {
      const inst = instance(name);
      if (inst) row.appendChild(inst);
    }
    showcase.appendChild(row);
  }
  root.appendChild(showcase);
}

// ---------------- helpers ----------------

function parseRgba(input: string): RGBA {
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return { r: 0, g: 0, b: 0, a: 0.1 };
  const p = m[1].split(',').map((x) => parseFloat(x.trim()));
  return { r: (p[0] || 0) / 255, g: (p[1] || 0) / 255, b: (p[2] || 0) / 255, a: p[3] ?? 0.1 };
}

function convertGradientToFigmaPaint(preset: GradientPreset): GradientPaint {
  const gradientStops = preset.stops.map((s) => {
    const rgb = hexToRgb(s.color);
    return {
      position: s.position,
      color: { r: rgb.r, g: rgb.g, b: rgb.b, a: s.opacity },
    };
  });

  if (preset.type === 'GRADIENT_RADIAL') {
    return {
      type: 'GRADIENT_RADIAL',
      gradientTransform: [
        [0.5, 0, 0.25],
        [0, 0.5, 0.25],
      ],
      gradientStops,
    };
  }

  if (preset.type === 'GRADIENT_ANGULAR') {
    return {
      type: 'GRADIENT_ANGULAR',
      gradientTransform: [
        [0.5, 0, 0.25],
        [0, 0.5, 0.25],
      ],
      gradientStops,
    };
  }

  if (preset.type === 'GRADIENT_DIAMOND') {
    return {
      type: 'GRADIENT_DIAMOND',
      gradientTransform: [
        [0.5, 0, 0.25],
        [0, 0.5, 0.25],
      ],
      gradientStops,
    };
  }

  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [0.707, 0.707, 0],
      [-0.707, 0.707, 0.5],
    ],
    gradientStops,
  };
}

async function buildCustomCard(
  title: string,
  sub1: string,
  sub2: string,
  paints: Paint[],
  width: number,
  height: number,
  isLight: boolean
): Promise<FrameNode> {
  const card = figma.createFrame();
  card.name = `${title} Card`;
  card.layoutMode = 'VERTICAL';
  card.resize(width, height);
  card.primaryAxisSizingMode = 'FIXED';
  card.counterAxisSizingMode = 'FIXED';
  card.primaryAxisAlignItems = 'MIN';
  card.counterAxisAlignItems = 'MIN';
  card.paddingTop = 24;
  card.paddingLeft = 24;
  card.paddingRight = 24;
  card.paddingBottom = 24;
  card.itemSpacing = 6;
  card.cornerRadius = 24;
  card.clipsContent = true;
  card.fills = paints;

  card.effects = [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.08 },
      offset: { x: 0, y: 0 },
      radius: 10,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ];

  const textTitleColor = isLight ? hexToRgb('#0F172A') : hexToRgb('#FFFFFF');
  const textSubColor = isLight ? hexToRgb('#334155') : hexToRgb('#F1F5F9');

  const nameText = figma.createText();
  nameText.fontName = await ensureFont('Google Sans', 600);
  nameText.fontSize = width > 300 ? 24 : 18;
  nameText.letterSpacing = { value: -3, unit: 'PERCENT' };
  nameText.characters = title;
  nameText.fills = [{ type: 'SOLID', color: textTitleColor }];
  if (!isLight) {
    nameText.effects = [
      {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.4 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
  }
  card.appendChild(nameText);

  if (sub1) {
    const sub1Text = figma.createText();
    sub1Text.fontName = await ensureFont('Google Sans', 500);
    sub1Text.fontSize = 13;
    sub1Text.letterSpacing = { value: -3, unit: 'PERCENT' };
    sub1Text.characters = sub1;
    sub1Text.fills = [{ type: 'SOLID', color: textSubColor }];
    if (!isLight) {
      sub1Text.effects = [
        {
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.4 },
          offset: { x: 0, y: 1 },
          radius: 3,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];
    }
    card.appendChild(sub1Text);
  }

  if (sub2) {
    const sub2Text = figma.createText();
    sub2Text.fontName = await ensureFont('Google Sans', 400);
    sub2Text.fontSize = 13;
    sub2Text.letterSpacing = { value: -3, unit: 'PERCENT' };
    sub2Text.characters = sub2;
    sub2Text.fills = [{ type: 'SOLID', color: textSubColor }];
    if (!isLight) {
      sub2Text.effects = [
        {
          type: 'DROP_SHADOW',
          color: { r: 0, g: 0, b: 0, a: 0.4 },
          offset: { x: 0, y: 1 },
          radius: 3,
          spread: 0,
          visible: true,
          blendMode: 'NORMAL',
        },
      ];
    }
    card.appendChild(sub2Text);
  }

  return card;
}

export async function generateColorExtensions(
  baseHex: string,
  colorName?: string,
  _config?: GenerationConfig,
  customGradientStops?: Record<string, string[]>
): Promise<void> {
  let colorPage = figma.root.children.find((p) => p.name === '🎨 Color System') || figma.createPage();
  colorPage.name = '🎨 Color System';
  await figma.setCurrentPageAsync(colorPage);

  const cleanHex = baseHex.replace('#', '').toUpperCase();
  const apiName = _config?.colorNames?.[cleanHex] || (await fetchColorName(baseHex));
  const resolvedName = colorName || apiName || `#${cleanHex}`;
  const displayTitle = apiName && apiName.toLowerCase() !== resolvedName.toLowerCase()
    ? `${resolvedName} (${apiName})`
    : resolvedName;
  const shadesBoardName = `${resolvedName} Shades Board`;
  const gradientsBoardName = `${resolvedName} Gradients Board`;

  // Remove existing boards with same names if re-generating
  for (const child of [...colorPage.children]) {
    if (child.name === shadesBoardName || child.name === gradientsBoardName) {
      child.remove();
    }
  }

  // Determine vertical placement below existing boards with 60px gap
  let startY = 0;
  for (const child of colorPage.children) {
    if ('y' in child && 'height' in child) {
      const bottom = (child as FrameNode).y + (child as FrameNode).height;
      if (bottom > startY) {
        startY = bottom;
      }
    }
  }
  if (startY > 0) {
    startY += 60; // 60px spacing below first/existing board
  }

  // --- SEPARATE BOARD 1: SHADES BOARD ---
  const shadesBoard = figma.createFrame();
  shadesBoard.name = shadesBoardName;
  shadesBoard.layoutMode = 'VERTICAL';
  shadesBoard.primaryAxisSizingMode = 'AUTO';
  shadesBoard.counterAxisSizingMode = 'AUTO';
  shadesBoard.counterAxisAlignItems = 'MIN';
  shadesBoard.itemSpacing = 24;
  shadesBoard.paddingTop = 56;
  shadesBoard.paddingBottom = 56;
  shadesBoard.paddingLeft = 56;
  shadesBoard.paddingRight = 56;
  shadesBoard.fills = [{ type: 'SOLID', color: hexToRgb('#FAFAFA') }];
  shadesBoard.cornerRadius = 25;
  shadesBoard.clipsContent = false;
  shadesBoard.x = 0;
  shadesBoard.y = startY;
  colorPage.appendChild(shadesBoard);

  // Header Section
  const shadesHeroHeader = await createBlackHeroBox(
    'Tokens',
    `${resolvedName} Color System`,
    'A color palette is simply a set of colors that work well together, combined to form a brand or a concept.',
    [
      {
        label: 'Primary colors',
        desc: "Your brand color defines the interface's feel and elicits emotion, used consistently across interactive elements.",
      },
      {
        label: 'Neutral colors',
        desc: 'Gray is foundational in UI design, used for text, form fields, backgrounds, and dividers.',
      },
      {
        label: 'Accent colors',
        desc: 'Secondary to the primary color, these grab attention and support brand identity in components like labels.',
      },
      {
        label: 'Feedback colors',
        desc: 'Highlight semantic states to provide visual feedback and warnings during interface use.',
      },
    ],
    952
  );
  shadesBoard.appendChild(shadesHeroHeader);

  // Generate All 11 Shades
  const shades = generateColorShades(baseHex);
  const shadeKeys: Array<keyof typeof shades> = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

  for (let i = 0; i < shadeKeys.length; i += 2) {
    const row = figma.createFrame();
    row.name = `Shades Row ${Math.floor(i / 2) + 1}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 24;
    row.fills = [];

    const k1 = shadeKeys[i];
    const hex1 = shades[k1];
    const cardTitle1 = k1 === 500 && apiName ? `Shade ${k1} (${apiName})` : `Shade ${k1}`;
    const card1 = await buildCustomCard(
      cardTitle1,
      `Hex: #${hex1.replace('#', '').toUpperCase()}`,
      `RGB: (${Math.round(hexToRgb(hex1).r * 255)}. ${Math.round(hexToRgb(hex1).g * 255)}. ${Math.round(hexToRgb(hex1).b * 255)})`,
      [{ type: 'SOLID', color: hexToRgb(hex1) }],
      i + 1 < shadeKeys.length ? 464 : 952,
      220,
      isLightColorHex(hex1)
    );
    row.appendChild(card1);

    if (i + 1 < shadeKeys.length) {
      const k2 = shadeKeys[i + 1];
      const hex2 = shades[k2];
      const cardTitle2 = k2 === 500 && apiName ? `Shade ${k2} (${apiName})` : `Shade ${k2}`;
      const card2 = await buildCustomCard(
        cardTitle2,
        `Hex: #${hex2.replace('#', '').toUpperCase()}`,
        `RGB: (${Math.round(hexToRgb(hex2).r * 255)}. ${Math.round(hexToRgb(hex2).g * 255)}. ${Math.round(hexToRgb(hex2).b * 255)})`,
        [{ type: 'SOLID', color: hexToRgb(hex2) }],
        464,
        220,
        isLightColorHex(hex2)
      );
      row.appendChild(card2);
    }

    shadesBoard.appendChild(row);
  }

  // --- SEPARATE BOARD 2: GRADIENTS BOARD ---
  const gradientsBoard = await buildGradientsBoard(baseHex, displayTitle, gradientsBoardName, customGradientStops);
  gradientsBoard.x = 0;
  gradientsBoard.y = startY + shadesBoard.height + 60;
  colorPage.appendChild(gradientsBoard);
}

/**
 * Nine OKLCH gradient presets derived from a base colour, as one board.
 *
 * The UI previews these and the message that triggers the colour command is
 * named "shades & gradients", but the board itself was never built. Presets
 * come from generateGradientsForColor(); each is converted to a Figma
 * GradientPaint and laid out two-up to match the shades board.
 */
async function buildGradientsBoard(
  baseHex: string,
  displayTitle: string,
  boardName: string,
  customGradientStops?: Record<string, string[]>
): Promise<FrameNode> {
  const gradients = generateGradientsForColor(baseHex);

  const gradientsBoard = figma.createFrame();
  gradientsBoard.name = boardName;
  gradientsBoard.layoutMode = 'VERTICAL';
  gradientsBoard.primaryAxisSizingMode = 'AUTO';
  gradientsBoard.counterAxisSizingMode = 'AUTO';
  gradientsBoard.counterAxisAlignItems = 'MIN';
  gradientsBoard.itemSpacing = 24;
  gradientsBoard.paddingTop = 56;
  gradientsBoard.paddingBottom = 56;
  gradientsBoard.paddingLeft = 56;
  gradientsBoard.paddingRight = 56;
  gradientsBoard.fills = [{ type: 'SOLID', color: hexToRgb('#FAFAFA') }];
  gradientsBoard.cornerRadius = 25;
  gradientsBoard.clipsContent = false;

  const gradientsHeroHeader = await createBlackHeroBox(
    'Gradients',
    `${displayTitle} Gradients`,
    'Nine gradients derived from your base color in OKLCH, so every blend stays perceptually even with no gray dead zones through the midpoint.',
    [
      {
        label: 'Monochromatic',
        desc: 'A single hue moving through lightness — the safest choice for large surfaces and backgrounds.',
      },
      {
        label: 'Analogous',
        desc: 'Neighbouring hues blended warm or cool, for gradients with more life than a monochrome ramp.',
      },
      {
        label: 'Radial',
        desc: 'A luminous focal point falling off into depth, useful for spotlights and hero sections.',
      },
      {
        label: 'Translucent',
        desc: 'Stops that fade in opacity, intended for glassmorphic overlays stacked over content.',
      },
    ],
    952
  );
  gradientsBoard.appendChild(gradientsHeroHeader);

  for (let i = 0; i < gradients.length; i += 2) {
    const row = figma.createFrame();
    row.name = `Gradients Row ${Math.floor(i / 2) + 1}`;
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 24;
    row.fills = [];

    for (let j = i; j < Math.min(i + 2, gradients.length); j++) {
      const preset = applyCustomStops(gradients[j], customGradientStops);
      // A gradient card is dark-on-light only when its own stops are light.
      const light = preset.stops.every((s) => isLightColorHex(s.color));
      const card = await buildCustomCard(
        preset.name,
        preset.description,
        preset.stops.map((s) => s.color.toUpperCase()).join(' → '),
        [convertGradientToFigmaPaint(preset)],
        gradients.length - i > 1 ? 464 : 952,
        220,
        light
      );
      row.appendChild(card);
    }

    gradientsBoard.appendChild(row);
  }

  return gradientsBoard;
}

/**
 * Overlay caller-supplied hex stops onto a generated preset, keeping each
 * stop's position and opacity. Lets the UI hand-tune a gradient without
 * reimplementing the OKLCH derivation. Presets with no override pass through.
 */
function applyCustomStops(
  preset: GradientPreset,
  overrides?: Record<string, string[]>
): GradientPreset {
  const custom = overrides?.[preset.id];
  if (!custom || custom.length === 0) return preset;

  return {
    ...preset,
    stops: preset.stops.map((stop, i) => (i < custom.length ? { ...stop, color: custom[i] } : stop)),
  };
}
