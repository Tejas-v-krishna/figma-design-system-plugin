// Standalone token boards matching the Color System Board visual design language.
import { DesignTokens, GenerationConfig } from '../../shared/types';
import { StyleMap, textStyleKey, effectStyleKey } from './styleKeys';
import { VariableMap } from './variables';
import { ensureFont } from './fonts';
import { setEffect } from './primitives';
import { hexToRgb } from '../../shared/color-utils';

export interface BoardContext {
  tokens: DesignTokens;
  config: GenerationConfig;
  styleMap: StyleMap;
  varMap: VariableMap;
}

export const CW = 904;
export const PAD = 56;

const C_DARK = '#0F172A';
const C_MUTED = '#64748B';
const C_BORDER = '#E2E8F0';
const C_PANEL = '#F8FAFC';

/** The padded, rounded surface every token board sits on matching Color System Board. */
export function boardShell(name: string): FrameNode {
  const board = figma.createFrame();
  board.name = name;
  board.layoutMode = 'VERTICAL';
  board.resize(CW + PAD * 2, 200);
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.counterAxisAlignItems = 'MIN';
  board.itemSpacing = 36;
  board.paddingTop = PAD;
  board.paddingBottom = PAD;
  board.paddingLeft = PAD;
  board.paddingRight = PAD;
  board.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  board.cornerRadius = 20;
  board.clipsContent = true;  // prevent component overflow from bleeding into adjacent boards
  board.effects = [
    {
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.06 },
      offset: { x: 0, y: 8 },
      radius: 32,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    },
  ];
  return board;
}

/** Obsidian hero header box matching Color System Board. */
export async function createBlackHeroBox(
  badgeText: string,
  titleText: string,
  mainDesc?: string,
  descItems?: { label: string; desc: string }[],
  width: number = CW,
  fontFamily: string = 'Google Sans'
): Promise<FrameNode> {
  const box = figma.createFrame();
  box.name = 'Header Black Box';
  box.layoutMode = 'VERTICAL';
  box.resize(width, 100);
  box.primaryAxisSizingMode = 'AUTO';
  box.counterAxisSizingMode = 'FIXED';
  box.paddingTop = 28;
  box.paddingBottom = 28;
  box.paddingLeft = 36;
  box.paddingRight = 36;
  box.itemSpacing = 14;
  box.cornerRadius = 16;
  box.fills = [{ type: 'SOLID', color: hexToRgb('#0B0C10') }];
  box.clipsContent = true;

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
    badge.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.05 }];
    badge.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.25 }];
    badge.strokeWeight = 1;

    const badgeTxt = figma.createText();
    badgeTxt.fontName = await ensureFont(fontFamily, 500);
    badgeTxt.fontSize = 11;
    badgeTxt.characters = badgeText;
    badgeTxt.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    badge.appendChild(badgeTxt);
    box.appendChild(badge);
  }

  const title = figma.createText();
  title.name = 'Title';
  title.fontName = await ensureFont(fontFamily, 700);
  title.fontSize = 36;
  title.letterSpacing = { value: -2, unit: 'PERCENT' };
  title.characters = titleText;
  title.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  box.appendChild(title);

  if (mainDesc) {
    const mainDescTxt = figma.createText();
    mainDescTxt.name = 'Main Description';
    mainDescTxt.fontName = await ensureFont(fontFamily, 400);
    mainDescTxt.fontSize = 13;
    mainDescTxt.characters = mainDesc;
    mainDescTxt.fills = [{ type: 'SOLID', color: hexToRgb('#CBD5E1') }];
    mainDescTxt.textAutoResize = 'HEIGHT';
    mainDescTxt.resize(width - 72, mainDescTxt.height);
    box.appendChild(mainDescTxt);
  }

  if (descItems && descItems.length > 0) {
    const listFrame = figma.createFrame();
    listFrame.name = 'Guidelines';
    listFrame.layoutMode = 'VERTICAL';
    listFrame.resize(width - 72, 100);
    listFrame.primaryAxisSizingMode = 'AUTO';
    listFrame.counterAxisSizingMode = 'FIXED';
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
      lbl.fontName = await ensureFont(fontFamily, 700);
      lbl.fontSize = 12;
      lbl.characters = `${item.label} : `;
      lbl.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];

      const body = figma.createText();
      body.fontName = await ensureFont(fontFamily, 400);
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

/** Section header banner with subtle gradient background. */
export async function mkSecHead(
  label: string,
  title: string,
  fontFamily: string = 'Google Sans'
): Promise<FrameNode> {
  const h = figma.createFrame();
  h.name = 'SectionHeader';
  h.layoutMode = 'VERTICAL';
  h.resize(CW, 76);
  h.primaryAxisSizingMode = 'AUTO';
  h.counterAxisSizingMode = 'FIXED';
  h.paddingTop = 16;
  h.paddingBottom = 16;
  h.paddingLeft = 24;
  h.paddingRight = 24;
  h.itemSpacing = 4;
  h.cornerRadius = 10;
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

  const eyebrow = figma.createText();
  eyebrow.fontName = await ensureFont(fontFamily, 600);
  eyebrow.fontSize = 11;
  eyebrow.characters = label.toUpperCase();
  eyebrow.letterSpacing = { value: 6, unit: 'PERCENT' };
  eyebrow.fills = [{ type: 'SOLID', color: hexToRgb(C_MUTED) }];
  h.appendChild(eyebrow);

  const heading = figma.createText();
  heading.fontName = await ensureFont(fontFamily, 700);
  heading.fontSize = 24;
  heading.letterSpacing = { value: -2, unit: 'PERCENT' };
  heading.characters = title;
  heading.fills = [{ type: 'SOLID', color: hexToRgb(C_DARK) }];
  h.appendChild(heading);

  return h;
}

export function mkDivider(): FrameNode {
  const d = figma.createFrame();
  d.name = 'Divider';
  d.resize(CW, 1);
  d.fills = [{ type: 'SOLID', color: hexToRgb(C_BORDER) }];
  return d;
}

async function label(
  parent: FrameNode,
  characters: string,
  opts: { family: string; weight: number; size: number; color?: string }
): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await ensureFont(opts.family, opts.weight);
  t.fontSize = opts.size;
  t.characters = characters;
  t.fills = [{ type: 'SOLID', color: hexToRgb(opts.color ?? C_DARK) }];
  parent.appendChild(t);
  return t;
}

function list(name: string, spacing = 16): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = 'VERTICAL';
  f.resize(CW, 100);
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  f.itemSpacing = spacing;
  f.paddingTop = 24;
  f.paddingBottom = 24;
  f.paddingLeft = 24;
  f.paddingRight = 24;
  f.cornerRadius = 16;
  f.fills = [{ type: 'SOLID', color: hexToRgb(C_PANEL) }];
  f.strokes = [{ type: 'SOLID', color: hexToRgb(C_BORDER) }];
  f.strokeWeight = 1;
  f.clipsContent = false;
  return f;
}

function row(name: string, spacing = 20): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = spacing;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

async function metaColumn(
  parent: FrameNode,
  name: string,
  detail: string,
  config: GenerationConfig,
  width = 220
): Promise<void> {
  const col = figma.createFrame();
  col.name = 'Meta';
  col.layoutMode = 'VERTICAL';
  col.resize(width, 40);
  col.primaryAxisSizingMode = 'AUTO';
  col.counterAxisSizingMode = 'FIXED';
  col.itemSpacing = 2;
  col.fills = [];
  col.clipsContent = false;
  parent.appendChild(col);

  await label(col, name, { family: config.fontFamily.body, weight: 600, size: 13, color: C_DARK });
  await label(col, detail, { family: config.fontFamily.mono, weight: 400, size: 11, color: C_MUTED });
}

// ---------------- typography ----------------

type TypographyGroupKey = 'headings' | 'body' | 'ui';

function groupTitle(group: TypographyGroupKey): string {
  if (group === 'headings') return 'Headings & Display';
  if (group === 'body') return 'Body Copy & Paragraphs';
  return 'UI, Labels & Captions';
}

export async function buildTypographyBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config, styleMap } = ctx;
  const board = boardShell('Typography Tokens');

  const hero = await createBlackHeroBox(
    'Tokens',
    'Typography System',
    `A mathematically scaled type hierarchy with ${tokens.typography.length} tokens on a ${config.typographyScale} scale, base ${config.baseFontSize}px.`,
    [
      {
        label: 'Display & Headings',
        desc: 'Page titles, hero sections, and prominent focal points across views.',
      },
      {
        label: 'Body Copy',
        desc: 'Optimized line height and weights for long-form reading and article prose.',
      },
      {
        label: 'UI & Labels',
        desc: 'Button labels, form inputs, tooltips, tags, and compact captions.',
      },
      {
        label: 'Monospace',
        desc: 'Tabular numbers, code blocks, keys, and developer data displays.',
      },
    ],
    CW,
    config.fontFamily.heading
  );
  board.appendChild(hero);
  board.appendChild(mkDivider());

  const groups: Array<TypographyGroupKey> = ['headings', 'body', 'ui'];
  for (const group of groups) {
    const inGroup = tokens.typography.filter((t) => t.group === group);
    if (!inGroup.length) continue;

    const sec = figma.createFrame();
    sec.name = `Section ${group}`;
    sec.layoutMode = 'VERTICAL';
    sec.primaryAxisSizingMode = 'AUTO';
    sec.counterAxisSizingMode = 'AUTO';
    sec.itemSpacing = 20;
    sec.fills = [];
    sec.clipsContent = false;

    sec.appendChild(await mkSecHead(`Scale / ${group}`, groupTitle(group), config.fontFamily.heading));
    sec.appendChild(mkDivider());

    const panel = list(`Typography: ${group}`, 20);
    sec.appendChild(panel);

    for (const t of inGroup) {
      const line = row(`Type ${t.name}`, 24);
      panel.appendChild(line);
      line.layoutMode = 'HORIZONTAL';
      line.resize(CW - 48, 40);
      line.primaryAxisSizingMode = 'FIXED';
      line.counterAxisSizingMode = 'AUTO';
      line.counterAxisAlignItems = 'CENTER';

      await metaColumn(line, t.name, `${t.fontSize}px / ${t.lineHeight}px · ${t.fontWeight}`, config, 220);

      const specimen = figma.createText();
      specimen.fontName = await ensureFont(t.fontFamily, t.fontWeight);
      specimen.fontSize = t.fontSize;
      specimen.characters = group === 'headings' ? 'The quick brown fox' : 'The quick brown fox jumps over the lazy dog';
      specimen.lineHeight = { value: Math.max(t.lineHeight, t.fontSize), unit: 'PIXELS' };
      specimen.letterSpacing = { value: t.letterSpacing, unit: 'PIXELS' };
      specimen.fills = [{ type: 'SOLID', color: hexToRgb(C_DARK) }];
      if (t.underline) specimen.textDecoration = 'UNDERLINE';
      specimen.textAutoResize = 'HEIGHT';
      specimen.resize(CW - 48 - 220 - 24, specimen.height);

      const key = textStyleKey(t.name);
      if (styleMap.text[key]) {
        try {
          await specimen.setTextStyleIdAsync(styleMap.text[key]);
        } catch {
          /* ignore */
        }
      }
      line.appendChild(specimen);
    }

    board.appendChild(sec);
    board.appendChild(mkDivider());
  }

  return board;
}

// ---------------- spacing ----------------

export async function buildSpacingBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Spacing Tokens');

  const hero = await createBlackHeroBox(
    'Foundations',
    'Spacing & Grid System',
    `${tokens.spacing.length} spatial steps based on a ${config.baseSpacing}px base grid for harmonious layouts, margins, and padding.`,
    [
      {
        label: 'Micro (2–8px)',
        desc: 'Tight internal component spacing, button icon gaps, tags, and badges.',
      },
      {
        label: 'Component (12–24px)',
        desc: 'Form field padding, card gaps, and list item separations.',
      },
      {
        label: 'Layout (32–64px)',
        desc: 'Section margins, card group grids, and dashboard panel boundaries.',
      },
      {
        label: 'Macro (80–128px)',
        desc: 'Major page section padding, hero containers, and landing dividers.',
      },
    ],
    CW,
    config.fontFamily.heading
  );
  board.appendChild(hero);
  board.appendChild(mkDivider());

  const sec = figma.createFrame();
  sec.name = 'Spacing Section';
  sec.layoutMode = 'VERTICAL';
  sec.primaryAxisSizingMode = 'AUTO';
  sec.counterAxisSizingMode = 'AUTO';
  sec.itemSpacing = 20;
  sec.fills = [];
  sec.clipsContent = false;

  sec.appendChild(await mkSecHead('Grid & Rhythm', 'Spacing Scale', config.fontFamily.heading));
  sec.appendChild(mkDivider());

  const panel = list('Spacing scale', 14);
  sec.appendChild(panel);

  const accent = tokens.colors.primary.shades['500'];
  for (const s of tokens.spacing) {
    const line = row(`Space ${s.name}`, 24);
    panel.appendChild(line);
    line.layoutSizingHorizontal = 'FILL';

    await metaColumn(line, s.name, `${s.value}px · ${s.rem}`, config, 200);

    const bar = figma.createRectangle();
    bar.name = `${s.value}px`;
    bar.resize(Math.max(4, s.value), 24);
    bar.cornerRadius = 4;
    bar.fills = [{ type: 'SOLID', color: hexToRgb(accent) }];
    line.appendChild(bar);
  }

  board.appendChild(sec);
  return board;
}

// ---------------- radius ----------------

export async function buildRadiusBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Radius Tokens');

  const hero = await createBlackHeroBox(
    'Foundations',
    'Corner Radius & Shape',
    `${tokens.borderRadius.length} radius tokens using the "${config.radiusPreset}" preset controlling corner softening across the design system.`,
    [
      {
        label: 'Sharp (0px)',
        desc: 'Strict rectangular geometry for high-density tables or editorial designs.',
      },
      {
        label: 'Subtle (2–6px)',
        desc: 'Form inputs, dropdown panels, tooltips, and compact tags.',
      },
      {
        label: 'Medium (8–16px)',
        desc: 'Standard cards, dialogs, notification banners, and buttons.',
      },
      {
        label: 'Pill (9999px)',
        desc: 'Status badges, avatar rings, and floating action buttons.',
      },
    ],
    CW,
    config.fontFamily.heading
  );
  board.appendChild(hero);
  board.appendChild(mkDivider());

  const sec = figma.createFrame();
  sec.name = 'Radius Section';
  sec.layoutMode = 'VERTICAL';
  sec.primaryAxisSizingMode = 'AUTO';
  sec.counterAxisSizingMode = 'AUTO';
  sec.itemSpacing = 20;
  sec.fills = [];
  sec.clipsContent = false;

  sec.appendChild(await mkSecHead('Geometry & Curvature', 'Border Radius Scale', config.fontFamily.heading));
  sec.appendChild(mkDivider());

  const panel = figma.createFrame();
  panel.name = 'Radius scale';
  panel.layoutMode = 'HORIZONTAL';
  panel.resize(CW, 100);
  panel.primaryAxisSizingMode = 'FIXED';
  panel.counterAxisSizingMode = 'AUTO';
  panel.layoutWrap = 'WRAP';
  panel.itemSpacing = 24;
  panel.counterAxisSpacing = 24;
  panel.paddingTop = 24;
  panel.paddingBottom = 24;
  panel.paddingLeft = 24;
  panel.paddingRight = 24;
  panel.cornerRadius = 16;
  panel.fills = [{ type: 'SOLID', color: hexToRgb(C_PANEL) }];
  panel.strokes = [{ type: 'SOLID', color: hexToRgb(C_BORDER) }];
  panel.strokeWeight = 1;
  panel.clipsContent = false;
  sec.appendChild(panel);

  const accent = tokens.colors.information.shades['500'];
  for (const r of tokens.borderRadius) {
    const cell = figma.createFrame();
    cell.name = `Radius ${r.name}`;
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'AUTO';
    cell.counterAxisSizingMode = 'AUTO';
    cell.counterAxisAlignItems = 'CENTER';
    cell.itemSpacing = 10;
    cell.fills = [];
    cell.clipsContent = false;
    panel.appendChild(cell);

    const box = figma.createRectangle();
    box.name = r.name;
    box.resize(88, 88);
    box.cornerRadius = Math.min(44, r.px);
    box.fills = [{ type: 'SOLID', color: hexToRgb(accent) }];
    cell.appendChild(box);

    await label(cell, r.name, { family: config.fontFamily.body, weight: 600, size: 12, color: C_DARK });
    await label(cell, `${r.px}px`, {
      family: config.fontFamily.mono,
      weight: 400,
      size: 11,
      color: C_MUTED,
    });
  }

  board.appendChild(sec);
  return board;
}

// ---------------- stroke ----------------

export async function buildStrokeBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Stroke Tokens');

  const hero = await createBlackHeroBox(
    'Foundations',
    'Stroke & Border System',
    `${tokens.strokes.length} border width tokens defining container edges, dividers, and focus boundaries.`,
    [
      {
        label: 'Hairline (1px)',
        desc: 'Standard boundary for cards, input fields, dividers, and table rows.',
      },
      {
        label: 'Medium (2px)',
        desc: 'Emphasis stroke for active states, selected cards, and strong dividers.',
      },
      {
        label: 'Thick (3–4px)',
        desc: 'High-contrast focus rings, highlighted selection outlines, and targets.',
      },
      {
        label: 'Heavy (6–8px)',
        desc: 'Progress indicators, visual accent borders, and decorative lines.',
      },
    ],
    CW,
    config.fontFamily.heading
  );
  board.appendChild(hero);
  board.appendChild(mkDivider());

  const sec = figma.createFrame();
  sec.name = 'Stroke Section';
  sec.layoutMode = 'VERTICAL';
  sec.primaryAxisSizingMode = 'AUTO';
  sec.counterAxisSizingMode = 'AUTO';
  sec.itemSpacing = 20;
  sec.fills = [];
  sec.clipsContent = false;

  sec.appendChild(await mkSecHead('Lines & Boundaries', 'Stroke Width Scale', config.fontFamily.heading));
  sec.appendChild(mkDivider());

  const panel = list('Stroke scale', 18);
  sec.appendChild(panel);

  const accent = tokens.colors.neutral.shades['700'];
  for (const s of tokens.strokes) {
    const line = row(`Stroke ${s.name}`, 24);
    panel.appendChild(line);
    line.layoutSizingHorizontal = 'FILL';

    await metaColumn(line, s.name, `${s.value}px`, config, 200);

    const box = figma.createFrame();
    box.name = `${s.value}px border`;
    box.resize(160, 48);
    box.cornerRadius = 10;
    box.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    box.strokes = [{ type: 'SOLID', color: hexToRgb(accent) }];
    box.strokeWeight = Math.max(1, s.value);
    box.clipsContent = false;
    line.appendChild(box);
  }

  board.appendChild(sec);
  return board;
}

// ---------------- effects ----------------

export async function buildEffectsBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config, styleMap, varMap } = ctx;
  const board = boardShell('Effect Tokens');

  const hero = await createBlackHeroBox(
    'Foundations',
    'Elevation & Depth System',
    `${tokens.shadows.length} shadow tokens at "${config.effectsIntensity}" intensity providing spatial hierarchy and depth affordance.`,
    [
      {
        label: 'Flat (0)',
        desc: 'Surfaces resting flush with the canvas without drop shadow.',
      },
      {
        label: 'Subtle (xs–sm)',
        desc: 'Gentle elevation for interactive buttons, cards, and dropdown menus.',
      },
      {
        label: 'Raised (md–lg)',
        desc: 'Noticeable depth for popovers, flyout menus, and sticky headers.',
      },
      {
        label: 'Floating (xl)',
        desc: 'Maximum elevation for modal dialogs, drawers, and lightbox overlays.',
      },
    ],
    CW,
    config.fontFamily.heading
  );
  board.appendChild(hero);
  board.appendChild(mkDivider());

  const sec = figma.createFrame();
  sec.name = 'Elevation Section';
  sec.layoutMode = 'VERTICAL';
  sec.primaryAxisSizingMode = 'AUTO';
  sec.counterAxisSizingMode = 'AUTO';
  sec.itemSpacing = 20;
  sec.fills = [];
  sec.clipsContent = false;

  sec.appendChild(await mkSecHead('Lighting & Hierarchy', 'Shadow & Elevation Scale', config.fontFamily.heading));
  sec.appendChild(mkDivider());

  const panel = figma.createFrame();
  panel.name = 'Elevation scale';
  panel.layoutMode = 'HORIZONTAL';
  panel.resize(CW, 100);
  panel.primaryAxisSizingMode = 'FIXED';
  panel.counterAxisSizingMode = 'AUTO';
  panel.layoutWrap = 'WRAP';
  panel.itemSpacing = 40;
  panel.counterAxisSpacing = 40;
  panel.paddingTop = 48;
  panel.paddingBottom = 48;
  panel.paddingLeft = 40;
  panel.paddingRight = 40;
  panel.cornerRadius = 16;
  panel.fills = [{ type: 'SOLID', color: hexToRgb(C_PANEL) }];
  panel.strokes = [{ type: 'SOLID', color: hexToRgb(C_BORDER) }];
  panel.strokeWeight = 1;
  panel.clipsContent = false;
  sec.appendChild(panel);

  for (const sh of tokens.shadows) {
    const cell = figma.createFrame();
    cell.name = `Elevation ${sh.name}`;
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'AUTO';
    cell.counterAxisSizingMode = 'AUTO';
    cell.counterAxisAlignItems = 'CENTER';
    cell.itemSpacing = 16;
    cell.fills = [];
    cell.clipsContent = false;
    panel.appendChild(cell);

    const card = figma.createFrame();
    card.name = sh.name;
    card.resize(130, 92);
    card.cornerRadius = 14;
    card.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
    card.strokes = [{ type: 'SOLID', color: hexToRgb(C_BORDER) }];
    card.strokeWeight = 1;
    card.clipsContent = false;
    setEffect(card, sh, effectStyleKey(sh.name), styleMap, varMap);
    cell.appendChild(card);

    await label(cell, sh.name, { family: config.fontFamily.body, weight: 600, size: 13, color: C_DARK });
  }

  board.appendChild(sec);
  return board;
}

// ---------------- registry ----------------

export type TokenBoardTarget = 'typography' | 'spacing' | 'radius' | 'stroke' | 'effects';

export const TOKEN_BOARD_BUILDERS: Record<TokenBoardTarget, (ctx: BoardContext) => Promise<FrameNode>> = {
  typography: buildTypographyBoard,
  spacing: buildSpacingBoard,
  radius: buildRadiusBoard,
  stroke: buildStrokeBoard,
  effects: buildEffectsBoard,
};

export function isTokenBoardTarget(target: string): target is TokenBoardTarget {
  return target in TOKEN_BOARD_BUILDERS;
}
