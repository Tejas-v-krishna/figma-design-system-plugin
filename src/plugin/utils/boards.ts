// Standalone token boards — one self-contained frame per token category.
//
// These started life as inline sections inside createTokensPage(), which meant
// the only way to render any single one of them was to regenerate the entire
// five-page design system. Pulling them out lets one category be generated on
// its own (the "Create <category> variables in Figma" button in the panel) while
// the full tokens page composes the exact same boards.
//
// Each builder returns a finished, hugging frame; the caller positions it.
import { DesignTokens, GenerationConfig } from '../../shared/types';
import { StyleMap, textStyleKey, effectStyleKey } from './styleKeys';
import { VariableMap } from './variables';
import { ensureFont, resolveFont } from './fonts';
import { setEffect } from './primitives';
import { hexToRgb } from '../../shared/color-utils';

export interface BoardContext {
  tokens: DesignTokens;
  config: GenerationConfig;
  styleMap: StyleMap;
  varMap: VariableMap;
}

const SURFACE = '#FAFAFA';
const CARD = '#FFFFFF';
const INK = '#0F172A';
const INK_MUTED = '#64748B';
const HAIRLINE = '#E2E8F0';

const BOARD_WIDTH = 1064;

/** The padded, rounded surface every token board sits on. */
function boardShell(name: string): FrameNode {
  const board = figma.createFrame();
  board.name = name;
  board.layoutMode = 'VERTICAL';
  board.counterAxisSizingMode = 'FIXED';
  board.resize(BOARD_WIDTH, 200);
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisAlignItems = 'MIN';
  board.itemSpacing = 28;
  board.paddingTop = 56;
  board.paddingBottom = 56;
  board.paddingLeft = 56;
  board.paddingRight = 56;
  board.fills = [{ type: 'SOLID', color: hexToRgb(SURFACE) }];
  board.cornerRadius = 24;
  board.clipsContent = false;
  return board;
}

/**
 * Append a text node. Awaited on purpose: the original code called an async
 * sectionTitle() without awaiting it, so the heading's appendChild ran a
 * microtask later — after the sections that followed had already been added,
 * which put every heading below its own content.
 */
async function label(
  parent: FrameNode,
  characters: string,
  opts: { family: string; weight: number; size: number; color?: string }
): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await ensureFont(opts.family, opts.weight);
  t.fontSize = opts.size;
  t.characters = characters;
  t.fills = [{ type: 'SOLID', color: hexToRgb(opts.color ?? INK) }];
  parent.appendChild(t);
  return t;
}

/** Title + one-line explanation, shared by every board. */
async function boardHeader(board: FrameNode, title: string, blurb: string, config: GenerationConfig): Promise<void> {
  const head = figma.createFrame();
  head.name = 'Header';
  head.layoutMode = 'VERTICAL';
  head.primaryAxisSizingMode = 'AUTO';
  head.counterAxisSizingMode = 'FIXED';
  head.resize(BOARD_WIDTH - 112, 10);
  head.itemSpacing = 8;
  head.fills = [];
  board.appendChild(head);

  await label(head, title, { family: config.fontFamily.heading, weight: 700, size: 28 });
  const desc = await label(head, blurb, {
    family: config.fontFamily.body,
    weight: 400,
    size: 14,
    color: INK_MUTED,
  });
  desc.layoutSizingHorizontal = 'FILL';
  desc.lineHeight = { value: 20, unit: 'PIXELS' };
}

/** A hugging row used for one specimen line. */
function row(name: string, spacing = 20): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = spacing;
  f.fills = [];
  return f;
}

/** A vertical list container that fills the board width. */
function list(name: string, spacing = 16): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.layoutMode = 'VERTICAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'FIXED';
  f.resize(BOARD_WIDTH - 112, 10);
  f.itemSpacing = spacing;
  f.paddingTop = 24;
  f.paddingBottom = 24;
  f.paddingLeft = 24;
  f.paddingRight = 24;
  f.cornerRadius = 16;
  f.fills = [{ type: 'SOLID', color: hexToRgb(CARD) }];
  f.strokes = [{ type: 'SOLID', color: hexToRgb(HAIRLINE) }];
  f.strokeWeight = 1;
  return f;
}

/** A fixed-width monospace-ish meta column so specimen rows line up. */
async function metaColumn(
  parent: FrameNode,
  name: string,
  detail: string,
  config: GenerationConfig,
  width = 200
): Promise<void> {
  const col = figma.createFrame();
  col.name = 'Meta';
  col.layoutMode = 'VERTICAL';
  col.counterAxisSizingMode = 'FIXED';
  col.resize(width, 10);
  col.primaryAxisSizingMode = 'AUTO';
  col.itemSpacing = 2;
  col.fills = [];
  parent.appendChild(col);

  await label(col, name, { family: config.fontFamily.body, weight: 600, size: 13 });
  await label(col, detail, { family: config.fontFamily.mono, weight: 400, size: 11, color: INK_MUTED });
}

// ---------------- typography ----------------

export async function buildTypographyBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config, styleMap } = ctx;
  const board = boardShell('Typography Tokens');
  await boardHeader(
    board,
    'Typography',
    `${tokens.typography.length} type tokens on a ${config.typographyScale} scale, base ${config.baseFontSize}px. Each specimen is bound to its generated Figma text style.`,
    config
  );

  const groups: Array<TypographyGroupKey> = ['headings', 'body', 'ui'];
  for (const group of groups) {
    const inGroup = tokens.typography.filter((t) => t.group === group);
    if (!inGroup.length) continue;

    await label(board, groupTitle(group), {
      family: config.fontFamily.heading,
      weight: 600,
      size: 15,
      color: INK_MUTED,
    });

    const panel = list(`Typography — ${group}`, 20);
    board.appendChild(panel);

    for (const t of inGroup) {
      const line = row(`Type ${t.name}`, 24);
      panel.appendChild(line);
      line.layoutSizingHorizontal = 'FILL';

      await metaColumn(line, t.name, `${t.fontSize}px / ${t.lineHeight}px · ${t.fontWeight}`, config, 220);

      const specimen = figma.createText();
      specimen.fontName = resolveFont(t.fontFamily, t.fontWeight);
      specimen.fontSize = Math.min(40, Math.max(12, t.fontSize));
      specimen.characters = 'The quick brown fox';
      specimen.lineHeight = { value: Math.max(t.lineHeight, t.fontSize), unit: 'PIXELS' };
      specimen.letterSpacing = { value: t.letterSpacing, unit: 'PIXELS' };
      specimen.fills = [{ type: 'SOLID', color: hexToRgb(INK) }];
      if (t.underline) specimen.textDecoration = 'UNDERLINE';

      const key = textStyleKey(t.name);
      if (styleMap.text[key]) {
        try {
          await specimen.setTextStyleIdAsync(styleMap.text[key]);
        } catch {
          /* style binding is a nicety; the literal values above still render */
        }
      }
      line.appendChild(specimen);
    }
  }

  return board;
}

type TypographyGroupKey = 'headings' | 'body' | 'ui';

function groupTitle(group: TypographyGroupKey): string {
  if (group === 'headings') return 'Headings';
  if (group === 'body') return 'Body';
  return 'UI / Labels';
}

// ---------------- spacing ----------------

export async function buildSpacingBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Spacing Tokens');
  await boardHeader(
    board,
    'Spacing',
    `${tokens.spacing.length} steps on a ${config.baseSpacing}px base grid. Use these for padding, gaps and margins so rhythm stays consistent.`,
    config
  );

  const panel = list('Spacing scale', 14);
  board.appendChild(panel);

  const accent = tokens.colors.primary.shades['500'];
  for (const s of tokens.spacing) {
    const line = row(`Space ${s.name}`, 24);
    panel.appendChild(line);
    line.layoutSizingHorizontal = 'FILL';

    await metaColumn(line, s.name, `${s.value}px · ${s.rem}`, config, 200);

    const bar = figma.createRectangle();
    bar.name = `${s.value}px`;
    bar.resize(Math.max(2, s.value), 24);
    bar.cornerRadius = 4;
    bar.fills = [{ type: 'SOLID', color: hexToRgb(accent) }];
    line.appendChild(bar);
  }

  return board;
}

// ---------------- radius ----------------

export async function buildRadiusBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Radius Tokens');
  await boardHeader(
    board,
    'Border radius',
    `${tokens.borderRadius.length} radius tokens from the "${config.radiusPreset}" preset. Every generated component corners off this scale.`,
    config
  );

  const panel = list('Radius scale', 24);
  panel.layoutMode = 'HORIZONTAL';
  panel.layoutWrap = 'WRAP';
  panel.counterAxisSpacing = 24;
  board.appendChild(panel);

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
    panel.appendChild(cell);

    const box = figma.createRectangle();
    box.name = r.name;
    box.resize(88, 88);
    box.cornerRadius = Math.min(44, r.px);
    box.fills = [{ type: 'SOLID', color: hexToRgb(accent) }];
    cell.appendChild(box);

    await label(cell, r.name, { family: config.fontFamily.body, weight: 600, size: 12 });
    await label(cell, `${r.px}px`, {
      family: config.fontFamily.mono,
      weight: 400,
      size: 11,
      color: INK_MUTED,
    });
  }

  return board;
}

// ---------------- stroke ----------------

export async function buildStrokeBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config } = ctx;
  const board = boardShell('Stroke Tokens');
  await boardHeader(
    board,
    'Stroke',
    `${tokens.strokes.length} border widths. Strokes were part of the token model but had no board of their own until now.`,
    config
  );

  const panel = list('Stroke scale', 18);
  board.appendChild(panel);

  const accent = tokens.colors.neutral.shades['700'];
  for (const s of tokens.strokes) {
    const line = row(`Stroke ${s.name}`, 24);
    panel.appendChild(line);
    line.layoutSizingHorizontal = 'FILL';

    await metaColumn(line, s.name, `${s.value}px`, config, 200);

    // A bordered box reads as a border width far more clearly than a bare line,
    // which is how stroke tokens are actually consumed by components.
    const box = figma.createFrame();
    box.name = `${s.value}px border`;
    box.resize(160, 48);
    box.cornerRadius = 10;
    box.fills = [{ type: 'SOLID', color: hexToRgb(CARD) }];
    box.strokes = [{ type: 'SOLID', color: hexToRgb(accent) }];
    box.strokeWeight = Math.max(1, s.value);
    line.appendChild(box);
  }

  return board;
}

// ---------------- effects ----------------

export async function buildEffectsBoard(ctx: BoardContext): Promise<FrameNode> {
  const { tokens, config, styleMap, varMap } = ctx;
  const board = boardShell('Effect Tokens');
  await boardHeader(
    board,
    'Elevation',
    `${tokens.shadows.length} shadow tokens at "${config.effectsIntensity}" intensity, each bound to a generated Figma effect style.`,
    config
  );

  const panel = list('Elevation scale', 32);
  panel.layoutMode = 'HORIZONTAL';
  panel.layoutWrap = 'WRAP';
  panel.counterAxisSpacing = 32;
  panel.paddingTop = 40;
  panel.paddingBottom = 40;
  board.appendChild(panel);

  for (const sh of tokens.shadows) {
    const cell = figma.createFrame();
    cell.name = `Elevation ${sh.name}`;
    cell.layoutMode = 'VERTICAL';
    cell.primaryAxisSizingMode = 'AUTO';
    cell.counterAxisSizingMode = 'AUTO';
    cell.counterAxisAlignItems = 'CENTER';
    cell.itemSpacing = 12;
    cell.fills = [];
    panel.appendChild(cell);

    const card = figma.createFrame();
    card.name = sh.name;
    card.resize(120, 88);
    card.cornerRadius = 14;
    card.fills = [{ type: 'SOLID', color: hexToRgb(CARD) }];
    setEffect(card, sh, effectStyleKey(sh.name), styleMap, varMap);
    cell.appendChild(card);

    await label(cell, sh.name, { family: config.fontFamily.body, weight: 600, size: 12 });
  }

  return board;
}

// ---------------- registry ----------------

/** Token categories that map to a single standalone board. */
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
