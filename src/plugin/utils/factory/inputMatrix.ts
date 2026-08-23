// 05. Inputs & Form Controls — Matrix Board Builder
// Draws a clean 5-column state matrix entirely with raw Figma primitives.
// No template delegation — gives us full async/await and layout control.
import { DesignTokens, GenerationConfig } from '../../../shared/types';
import { hexToRgb } from '../../../shared/color-utils';
import { ensureFont } from '../fonts';
import { colorShade } from '../tokenAccess';
import { StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';

// ─── colour helpers ────────────────────────────────────────────────────────

function rgb(hex: string): RGB {
  return hexToRgb(hex);
}

// ─── layout constants ──────────────────────────────────────────────────────

const BOARD_PAD   = 48;
const MATRIX_PAD  = 32;
const TOTAL_W     = 960;  // inner matrix width
const LABEL_W     = 144;  // left row-label column
const COL_GAP     = 12;   // gap between state columns
const NUM_COLS    = 5;    // Default | Hover | Focused | Error | Disabled
const COL_W       = Math.floor((TOTAL_W - MATRIX_PAD * 2 - LABEL_W - COL_GAP * (NUM_COLS - 1)) / NUM_COLS);  // ≈128 px

const INPUT_H     = 36;   // height of an input cell frame
const TEXTAREA_H  = 58;   // height of a textarea cell frame
const ROW_GAP     = 10;   // vertical spacing between rows
const GROUP_GAP   = 20;   // extra top spacing for first row of a new group

const STATES = ['Default', 'Hover', 'Focused', 'Error', 'Disabled'] as const;
type State = typeof STATES[number];

// ─── sub-builders ──────────────────────────────────────────────────────────

function frame(name: string): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

function hbox(name: string, gap = 0): FrameNode {
  const f = frame(name);
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = gap;
  return f;
}


async function txt(
  characters: string,
  family: string,
  weight: number,
  size: number,
  fill: string
): Promise<TextNode> {
  const t = figma.createText();
  t.fontName = await ensureFont(family, weight);
  t.fontSize = size;
  t.characters = characters;
  t.fills = [{ type: 'SOLID', color: rgb(fill) }];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  return t;
}

// Draw one input field cell at COL_W × INPUT_H
async function drawInputCell(
  tokens: DesignTokens,
  variant: string,   // 'default' | 'email' | 'password' | 'search' | 'number'
  state: State,
  family: string
): Promise<FrameNode> {
  const isError    = state === 'Error';
  const isFocus    = state === 'Focused';
  const isHover    = state === 'Hover';
  const isDisabled = state === 'Disabled';

  const control = frame(`input-${variant}-${state}`);
  control.layoutMode = 'HORIZONTAL';
  control.primaryAxisSizingMode = 'FIXED';
  control.counterAxisSizingMode = 'FIXED';
  control.primaryAxisAlignItems = 'MIN';
  control.counterAxisAlignItems = 'CENTER';
  control.itemSpacing = 5;
  control.paddingLeft = 8;
  control.paddingRight = 8;
  control.resize(COL_W, INPUT_H);
  control.cornerRadius = 6;
  control.clipsContent = true;

  // Background & border
  if (isDisabled) {
    control.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 100)) }];
    control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 200)) }];
    control.strokeWeight = 1;
    control.opacity = 0.6;
  } else {
    control.fills = [{ type: 'SOLID', color: rgb('#FFFFFF') }];
    if (isError) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'error', 500)) }];
      control.strokeWeight = 1.5;
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.94, g: 0.27, b: 0.27, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocus) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'primary', 500)) }];
      control.strokeWeight = 1.5;
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.23, g: 0.51, b: 0.96, a: 0.18 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isHover) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 400)) }];
      control.strokeWeight = 1;
    } else {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 300)) }];
      control.strokeWeight = 1;
    }
  }

  const textFill        = isDisabled ? colorShade(tokens, 'neutral', 400) : colorShade(tokens, 'neutral', 900);
  const placeholderFill = colorShade(tokens, 'neutral', 400);
  const iconFill        = isError ? colorShade(tokens, 'error', 400) : colorShade(tokens, 'neutral', 400);
  const fs              = 11; // font-size inside cell

  // Icon placeholder — a small coloured rect inside a frame
  const iconRect = (fill: string): FrameNode => {
    const rect = figma.createRectangle();
    rect.resize(12, 12);
    rect.cornerRadius = 3;
    rect.fills = [{ type: 'SOLID', color: rgb(fill) }];
    const container = frame('icon');
    container.resize(12, 12);
    container.fills = [];
    container.appendChild(rect);
    return container;
  };

  if (variant === 'email') {
    const iconC = iconRect(iconFill);
    iconC.resize(12, 12);
    control.appendChild(iconC);
    const v = await txt(isError ? 'invalid@email' : 'alex@ex.com', family, 400, fs, isError ? colorShade(tokens, 'error', 600) : textFill);
    control.appendChild(v);

  } else if (variant === 'password') {
    const iconC = iconRect(iconFill);
    iconC.resize(12, 12);
    control.appendChild(iconC);
    const dots = await txt('••••••', family, 400, fs, textFill);
    dots.layoutSizingHorizontal = 'FILL';
    control.appendChild(dots);
    const eyeC = iconRect(colorShade(tokens, 'neutral', 400));
    eyeC.resize(12, 12);
    control.appendChild(eyeC);

  } else if (variant === 'search') {
    const iconC = iconRect(colorShade(tokens, 'neutral', 400));
    iconC.resize(12, 12);
    control.appendChild(iconC);
    const p = await txt(isFocus ? 'Search…|' : 'Search…', family, 400, fs, isFocus ? textFill : placeholderFill);
    control.appendChild(p);

  } else if (variant === 'number') {
    const val = await txt('42', family, 500, fs, textFill);
    val.layoutSizingHorizontal = 'FILL';
    control.appendChild(val);
    // stepper buttons
    const steps = hbox('stepper', 2);
    const minus = await txt('−', family, 600, 10, colorShade(tokens, 'neutral', 500));
    const plus  = await txt('+', family, 600, 10, colorShade(tokens, 'neutral', 500));
    steps.appendChild(minus);
    steps.appendChild(plus);
    control.appendChild(steps);

  } else {
    // default / standard field
    let content = 'Enter text…';
    let fill = placeholderFill;
    if (isFocus)    { content = 'Typing…|'; fill = textFill; }
    if (isError)    { content = 'Invalid input'; fill = colorShade(tokens, 'error', 600); }
    const p = await txt(content, family, 400, fs, fill);
    control.appendChild(p);
  }

  return control;
}

// Draw one textarea cell at COL_W × TEXTAREA_H
async function drawTextareaCell(
  tokens: DesignTokens,
  variant: string,
  state: State,
  family: string
): Promise<FrameNode> {
  const isError    = state === 'Error';
  const isFocus    = state === 'Focused';
  const isHover    = state === 'Hover';
  const isDisabled = state === 'Disabled';

  const control = frame(`textarea-${variant}-${state}`);
  control.layoutMode = 'VERTICAL';
  control.primaryAxisSizingMode = 'FIXED';
  control.counterAxisSizingMode = 'FIXED';
  control.primaryAxisAlignItems = 'MIN';
  control.counterAxisAlignItems = 'MIN';
  control.paddingTop = 6;
  control.paddingBottom = 6;
  control.paddingLeft = 8;
  control.paddingRight = 8;
  control.resize(COL_W, TEXTAREA_H);
  control.cornerRadius = 6;
  control.clipsContent = true;

  if (isDisabled) {
    control.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 100)) }];
    control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 200)) }];
    control.strokeWeight = 1;
    control.opacity = 0.6;
  } else {
    control.fills = [{ type: 'SOLID', color: rgb('#FFFFFF') }];
    if (isError) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'error', 500)) }];
      control.strokeWeight = 1.5;
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.94, g: 0.27, b: 0.27, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocus) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'primary', 500)) }];
      control.strokeWeight = 1.5;
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.23, g: 0.51, b: 0.96, a: 0.18 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isHover) {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 400)) }];
      control.strokeWeight = 1;
    } else {
      control.strokes = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 300)) }];
      control.strokeWeight = 1;
    }
  }

  const textFill = isDisabled ? colorShade(tokens, 'neutral', 400) : colorShade(tokens, 'neutral', 900);
  const placeholderFill = colorShade(tokens, 'neutral', 400);
  const fs = 10;

  let content = 'Enter text…';
  let fill = placeholderFill;
  if (isFocus)    { content = 'Typing…|'; fill = textFill; }
  if (isError)    { content = 'Exceeded limit…'; fill = colorShade(tokens, 'error', 600); }

  const body = figma.createText();
  body.fontName = await ensureFont(family, 400);
  body.fontSize = fs;
  body.characters = content;
  body.fills = [{ type: 'SOLID', color: rgb(fill) }];
  body.textAutoResize = 'WIDTH_AND_HEIGHT';
  body.resize(COL_W - 16, body.height);
  control.appendChild(body);

  // resize handle dot in bottom-right for non-disabled
  if (!isDisabled && variant === 'auto-resize') {
    const grip = figma.createText();
    grip.fontName = await ensureFont(family, 400);
    grip.fontSize = 9;
    grip.characters = '⌟';
    grip.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'neutral', 300)) }];
    grip.textAutoResize = 'WIDTH_AND_HEIGHT';
    control.appendChild(grip);
  }

  return control;
}


// ─── main export ───────────────────────────────────────────────────────────

export async function buildInputMatrixBoard(
  tokens: DesignTokens,
  _config: GenerationConfig,
  _styleMap?: StyleMap,
  _varMap?: VariableMap
): Promise<FrameNode> {
  const family  = 'Google Sans';
  const BOARD_W = TOTAL_W + BOARD_PAD * 2;

  // ── outer board ──────────────────────────────────────────────────────────
  const board = figma.createFrame();
  board.name = '05. Inputs & Form Controls';
  board.layoutMode = 'VERTICAL';
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.clipsContent = false;
  board.resize(BOARD_W, 200);
  board.itemSpacing = 24;
  board.paddingTop    = BOARD_PAD;
  board.paddingBottom = BOARD_PAD;
  board.paddingLeft   = BOARD_PAD;
  board.paddingRight  = BOARD_PAD;
  board.cornerRadius  = 24;
  board.fills = [{ type: 'SOLID', color: rgb('#F8FAFC') }];

  // ── section header ───────────────────────────────────────────────────────
  const header = figma.createFrame();
  header.name = 'Header';
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';
  header.counterAxisAlignItems = 'CENTER';
  header.itemSpacing = 8;
  header.fills = [];

  const numTxt = figma.createText();
  numTxt.fontName = await ensureFont(family, 700);
  numTxt.fontSize = 22;
  numTxt.characters = '05.';
  numTxt.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'primary', 600)) }];
  header.appendChild(numTxt);

  const titleTxt = figma.createText();
  titleTxt.fontName = await ensureFont(family, 700);
  titleTxt.fontSize = 22;
  titleTxt.characters = 'Inputs & Form Controls';
  titleTxt.fills = [{ type: 'SOLID', color: rgb('#0F172A') }];
  header.appendChild(titleTxt);

  board.appendChild(header);

  // ── column header bar ────────────────────────────────────────────────────
  const colHeaderBar = figma.createFrame();
  colHeaderBar.name = 'Column Headers';
  colHeaderBar.layoutMode = 'NONE'; // absolute positioning
  colHeaderBar.fills = [];
  colHeaderBar.clipsContent = false;
  colHeaderBar.resize(TOTAL_W, 20);

  let hx = MATRIX_PAD + LABEL_W;
  for (const state of STATES) {
    const stLbl = figma.createText();
    stLbl.fontName = await ensureFont(family, 600);
    stLbl.fontSize = 10;
    stLbl.characters = state.toUpperCase();
    stLbl.fills = [{ type: 'SOLID', color: rgb('#94A3B8') }];
    stLbl.textAlignHorizontal = 'CENTER';
    stLbl.textAutoResize = 'WIDTH_AND_HEIGHT';
    // Center the text within the column
    stLbl.x = hx + Math.round((COL_W - stLbl.width) / 2);
    stLbl.y = 0;
    colHeaderBar.appendChild(stLbl);
    hx += COL_W + COL_GAP;
  }

  board.appendChild(colHeaderBar);

  // ── matrix box (white card with dashed border) ────────────────────────────
  const matrixBox = figma.createFrame();
  matrixBox.name = 'Matrix Box';
  matrixBox.layoutMode = 'NONE'; // absolute children
  matrixBox.fills = [{ type: 'SOLID', color: rgb('#FFFFFF') }];
  matrixBox.clipsContent = false;
  matrixBox.strokes = [{ type: 'SOLID', color: rgb('#CBD5E1') }];
  matrixBox.strokeWeight = 1.5;
  matrixBox.dashPattern = [6, 6];
  matrixBox.cornerRadius = 16;
  matrixBox.resize(TOTAL_W, 100); // will resize after rows added

  board.appendChild(matrixBox);

  // ── rows ─────────────────────────────────────────────────────────────────
  // We draw rows as absolutely positioned children inside matrixBox
  // Each row x starts at MATRIX_PAD, y accumulates

  const ROW_DEFS: Array<{
    group: string;
    label: string;
    variant: string;
    isTextarea?: boolean;
    isFirstInGroup?: boolean;
  }> = [
    { group: 'Text Inputs', label: 'Standard', variant: 'default', isFirstInGroup: true },
    { group: '',            label: 'Email',     variant: 'email' },
    { group: '',            label: 'Password',  variant: 'password' },
    { group: '',            label: 'Search',    variant: 'search' },
    { group: '',            label: 'Number',    variant: 'number' },
    { group: 'Textarea',   label: 'Standard',  variant: 'default',      isTextarea: true, isFirstInGroup: true },
    { group: '',           label: 'Auto-Resize',variant: 'auto-resize',  isTextarea: true },
  ];

  let currentY = MATRIX_PAD;

  for (const def of ROW_DEFS) {
    if (def.isFirstInGroup && currentY > MATRIX_PAD) {
      currentY += GROUP_GAP;
    }

    const rowH = def.isTextarea ? TEXTAREA_H : INPUT_H;

    // Row container
    const rowFrame = frame(`row-${def.variant}${def.isTextarea ? '-ta' : ''}`);
    rowFrame.x = MATRIX_PAD;
    rowFrame.y = currentY;
    rowFrame.resize(TOTAL_W - MATRIX_PAD * 2, rowH);
    matrixBox.appendChild(rowFrame);

    // Label column
    const labelBox = figma.createFrame();
    labelBox.name = 'Label';
    labelBox.layoutMode = 'VERTICAL';
    labelBox.primaryAxisSizingMode = 'AUTO';
    labelBox.counterAxisSizingMode = 'FIXED';
    labelBox.counterAxisAlignItems = 'MIN';
    labelBox.primaryAxisAlignItems = 'CENTER';
    labelBox.itemSpacing = 1;
    labelBox.fills = [];
    labelBox.x = 0;
    labelBox.y = 0;
    labelBox.resize(LABEL_W, rowH);

    if (def.group) {
      const gl = figma.createText();
      gl.fontName = await ensureFont(family, 700);
      gl.fontSize = 11;
      gl.characters = def.group;
      gl.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'primary', 600)) }];
      labelBox.appendChild(gl);
    }

    const rl = figma.createText();
    rl.fontName = await ensureFont(family, 500);
    rl.fontSize = 10;
    rl.characters = def.label;
    rl.fills = [{ type: 'SOLID', color: rgb('#94A3B8') }];
    labelBox.appendChild(rl);
    rowFrame.appendChild(labelBox);

    // 5 state cells
    let cellX = LABEL_W;
    for (const state of STATES) {
      const cell = def.isTextarea
        ? await drawTextareaCell(tokens, def.variant, state, family)
        : await drawInputCell(tokens, def.variant, state, family);
      cell.x = cellX;
      cell.y = 0;
      rowFrame.appendChild(cell);
      cellX += COL_W + COL_GAP;
    }

    currentY += rowH + ROW_GAP;
  }

  // Final height
  matrixBox.resize(TOTAL_W, currentY + MATRIX_PAD - ROW_GAP);

  return board;
}
