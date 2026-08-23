// 04. Buttons — Matrix Board Builder
// Draws a clean 5-column state matrix with raw Figma primitives.
// No template delegation — full async/await control.
import { DesignTokens, GenerationConfig } from '../../../shared/types';
import { hexToRgb } from '../../../shared/color-utils';
import { ensureFont } from '../fonts';
import { colorShade } from '../tokenAccess';
import { StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';

// ─── layout constants ──────────────────────────────────────────────────────

const BOARD_PAD  = 48;
const MATRIX_PAD = 32;
const TOTAL_W    = 960;
const LABEL_W    = 144;
const COL_GAP    = 12;
const NUM_COLS   = 5;
const COL_W      = Math.floor((TOTAL_W - MATRIX_PAD * 2 - LABEL_W - COL_GAP * (NUM_COLS - 1)) / NUM_COLS); // ≈128 px

const LG_H       = 40;
const SM_H       = 32;
const ROW_GAP    = 8;
const GROUP_GAP  = 18;

const STATES = ['Default', 'Hover', 'Focused', 'Active', 'Disabled'] as const;
type State = typeof STATES[number];

function rgb(hex: string): RGB {
  return hexToRgb(hex);
}

function frame(name: string): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

async function drawButtonCell(
  tokens: DesignTokens,
  variant: 'primary' | 'outline' | 'ghost' | 'black',
  state: State,
  size: 'lg' | 'sm',
  icon: 'none' | 'left' | 'right',
  isIconOnly: boolean,
  family: string
): Promise<FrameNode> {
  const isHover    = state === 'Hover';
  const isFocus    = state === 'Focused';
  const isActive   = state === 'Active';
  const isDisabled = state === 'Disabled';

  const H = size === 'sm' ? SM_H : LG_H;
  const fs = size === 'sm' ? 11 : 13;
  const padX = isIconOnly ? 0 : (size === 'sm' ? 12 : 16);
  const padY = Math.round((H - fs * 1.2) / 2);

  const btn = frame(`btn-${variant}-${state}-${size}`);
  btn.layoutMode = 'HORIZONTAL';
  btn.primaryAxisAlignItems = 'CENTER';
  btn.counterAxisAlignItems = 'CENTER';
  btn.primaryAxisSizingMode = 'AUTO';
  btn.counterAxisSizingMode = 'AUTO';
  btn.itemSpacing = 5;
  btn.paddingTop = padY;
  btn.paddingBottom = padY;
  btn.paddingLeft = isIconOnly ? padY : padX;
  btn.paddingRight = isIconOnly ? padY : padX;
  btn.cornerRadius = 9999; // pill shape

  if (isDisabled) {
    btn.opacity = 0.45;
  }

  // Colours per variant × state
  let bgHex  = '';
  let fgHex  = '#FFFFFF';
  let strokeHex = '';
  let strokeW = 0;
  let shadowColor: RGBA | null = null;

  if (variant === 'primary') {
    bgHex = isActive ? colorShade(tokens, 'primary', 700)
          : isHover  ? colorShade(tokens, 'primary', 600)
          : isDisabled ? colorShade(tokens, 'primary', 200)
          : colorShade(tokens, 'primary', 500);
    fgHex = '#FFFFFF';
    if (isFocus) shadowColor = { r: 0.23, g: 0.51, b: 0.96, a: 0.35 };

  } else if (variant === 'outline') {
    bgHex = isActive ? colorShade(tokens, 'neutral', 200)
          : isHover  ? colorShade(tokens, 'neutral', 100)
          : '#FFFFFF';
    fgHex = colorShade(tokens, 'neutral', 900);
    strokeHex = isFocus ? colorShade(tokens, 'primary', 500) : colorShade(tokens, 'neutral', 300);
    strokeW = isFocus ? 1.5 : 1.5;
    if (isFocus) shadowColor = { r: 0.23, g: 0.51, b: 0.96, a: 0.20 };

  } else if (variant === 'ghost') {
    bgHex = isActive ? colorShade(tokens, 'primary', 100)
          : isHover  ? colorShade(tokens, 'primary', 50)
          : '';
    fgHex = colorShade(tokens, 'primary', 600);
    if (isFocus) { strokeHex = colorShade(tokens, 'primary', 400); strokeW = 1.5; }

  } else {
    // black
    bgHex = isActive ? '#09090B'
          : isHover  ? '#27272A'
          : isDisabled ? '#D4D4D8'
          : '#18181B';
    fgHex = '#FFFFFF';
    if (isFocus) shadowColor = { r: 0.1, g: 0.1, b: 0.1, a: 0.30 };
  }

  // Apply background
  if (bgHex) {
    btn.fills = [{ type: 'SOLID', color: rgb(bgHex) }];
  } else {
    btn.fills = [];
  }

  // Apply stroke
  if (strokeHex && strokeW) {
    btn.strokes = [{ type: 'SOLID', color: rgb(strokeHex) }];
    btn.strokeWeight = strokeW;
  }

  // Apply focus ring
  if (shadowColor && isFocus) {
    btn.effects = [{
      type: 'DROP_SHADOW',
      color: shadowColor,
      offset: { x: 0, y: 0 },
      radius: 4,
      spread: 3,
      visible: true,
      blendMode: 'NORMAL',
    }];
  }

  // Icon placeholder (coloured rectangle)
  const iconBox = (fill: string, w = 12, h = 12): FrameNode => {
    const c = figma.createFrame();
    c.name = 'icon';
    c.resize(w, h);
    c.cornerRadius = 2;
    c.fills = [{ type: 'SOLID', color: rgb(fill) }];
    return c;
  };

  if (isIconOnly) {
    const sz = size === 'sm' ? 14 : 16;
    btn.appendChild(iconBox(fgHex, sz, sz));
  } else {
    if (icon === 'left') btn.appendChild(iconBox(fgHex));

    const lbl = figma.createText();
    lbl.fontName = await ensureFont(family, 600);
    lbl.fontSize = fs;
    lbl.characters = 'Button';
    lbl.fills = [{ type: 'SOLID', color: rgb(fgHex) }];
    btn.appendChild(lbl);

    if (icon === 'right') btn.appendChild(iconBox(fgHex));
  }

  return btn;
}

// ─── main export ───────────────────────────────────────────────────────────

export async function buildButtonMatrixBoard(
  tokens: DesignTokens,
  _config: GenerationConfig,
  _styleMap?: StyleMap,
  _varMap?: VariableMap
): Promise<FrameNode> {
  const family  = 'Google Sans';
  const BOARD_W = TOTAL_W + BOARD_PAD * 2;

  // ── outer board ──────────────────────────────────────────────────────────
  const board = figma.createFrame();
  board.name = '04. Buttons';
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
  numTxt.characters = '04.';
  numTxt.fills = [{ type: 'SOLID', color: rgb(colorShade(tokens, 'primary', 600)) }];
  header.appendChild(numTxt);

  const titleTxt = figma.createText();
  titleTxt.fontName = await ensureFont(family, 700);
  titleTxt.fontSize = 22;
  titleTxt.characters = 'Buttons';
  titleTxt.fills = [{ type: 'SOLID', color: rgb('#0F172A') }];
  header.appendChild(titleTxt);

  board.appendChild(header);

  // ── column header bar ────────────────────────────────────────────────────
  const colHeaderBar = figma.createFrame();
  colHeaderBar.name = 'Column Headers';
  colHeaderBar.layoutMode = 'NONE';
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
    stLbl.x = hx + Math.round((COL_W - stLbl.width) / 2);
    stLbl.y = 0;
    colHeaderBar.appendChild(stLbl);
    hx += COL_W + COL_GAP;
  }

  board.appendChild(colHeaderBar);

  // ── matrix box ───────────────────────────────────────────────────────────
  const matrixBox = figma.createFrame();
  matrixBox.name = 'Matrix Box';
  matrixBox.layoutMode = 'NONE';
  matrixBox.fills = [{ type: 'SOLID', color: rgb('#FFFFFF') }];
  matrixBox.clipsContent = false;
  matrixBox.strokes = [{ type: 'SOLID', color: rgb('#CBD5E1') }];
  matrixBox.strokeWeight = 1.5;
  matrixBox.dashPattern = [6, 6];
  matrixBox.cornerRadius = 16;
  matrixBox.resize(TOTAL_W, 100);

  board.appendChild(matrixBox);

  // ── row definitions ───────────────────────────────────────────────────────
  type RowDef = {
    group: string;
    label: string;
    variant: 'primary' | 'outline' | 'ghost' | 'black';
    size: 'lg' | 'sm';
    icon: 'none' | 'left' | 'right';
    isIconOnly?: boolean;
    isFirstInGroup?: boolean;
  };

  const ROW_DEFS: RowDef[] = [
    // Primary Large
    { group: 'Primary',  label: 'Large',      variant: 'primary', size: 'lg', icon: 'none', isFirstInGroup: true },
    { group: '',         label: 'icon right',  variant: 'primary', size: 'lg', icon: 'right' },
    { group: '',         label: 'icon left',   variant: 'primary', size: 'lg', icon: 'left' },
    // Primary Small
    { group: 'Primary',  label: 'Small',      variant: 'primary', size: 'sm', icon: 'none', isFirstInGroup: true },
    { group: '',         label: 'icon right',  variant: 'primary', size: 'sm', icon: 'right' },
    { group: '',         label: 'icon left',   variant: 'primary', size: 'sm', icon: 'left' },
    // Secondary Large
    { group: 'Secondary', label: 'Large',     variant: 'outline', size: 'lg', icon: 'none', isFirstInGroup: true },
    { group: '',          label: 'icon right', variant: 'outline', size: 'lg', icon: 'right' },
    { group: '',          label: 'icon left',  variant: 'outline', size: 'lg', icon: 'left' },
    // Secondary Small
    { group: 'Secondary', label: 'Small',     variant: 'outline', size: 'sm', icon: 'none', isFirstInGroup: true },
    { group: '',          label: 'icon right', variant: 'outline', size: 'sm', icon: 'right' },
    { group: '',          label: 'icon left',  variant: 'outline', size: 'sm', icon: 'left' },
    // Tertiary Large
    { group: 'Tertiary', label: 'Large',      variant: 'ghost', size: 'lg', icon: 'none', isFirstInGroup: true },
    { group: '',         label: 'icon right',  variant: 'ghost', size: 'lg', icon: 'right' },
    { group: '',         label: 'icon left',   variant: 'ghost', size: 'lg', icon: 'left' },
    // Tertiary Small
    { group: 'Tertiary', label: 'Small',      variant: 'ghost', size: 'sm', icon: 'none', isFirstInGroup: true },
    { group: '',         label: 'icon right',  variant: 'ghost', size: 'sm', icon: 'right' },
    { group: '',         label: 'icon left',   variant: 'ghost', size: 'sm', icon: 'left' },
    // Black Large
    { group: 'Black',  label: 'Large',        variant: 'black', size: 'lg', icon: 'none', isFirstInGroup: true },
    { group: '',       label: 'icon right',    variant: 'black', size: 'lg', icon: 'right' },
    { group: '',       label: 'icon left',     variant: 'black', size: 'lg', icon: 'left' },
    // Black Small
    { group: 'Black',  label: 'Small',        variant: 'black', size: 'sm', icon: 'none', isFirstInGroup: true },
    { group: '',       label: 'icon right',    variant: 'black', size: 'sm', icon: 'right' },
    { group: '',       label: 'icon left',     variant: 'black', size: 'sm', icon: 'left' },
    // Icon Only
    { group: 'Icon Only', label: 'Large',     variant: 'black', size: 'lg', icon: 'none', isIconOnly: true, isFirstInGroup: true },
    { group: '',          label: 'Small',      variant: 'black', size: 'sm', icon: 'none', isIconOnly: true },
  ];

  let currentY = MATRIX_PAD;

  for (const def of ROW_DEFS) {
    if (def.isFirstInGroup && currentY > MATRIX_PAD) {
      currentY += GROUP_GAP;
    }

    const H = def.size === 'sm' ? SM_H : LG_H;

    const rowFrame = frame(`row-${def.variant}-${def.size}-${def.icon}`);
    rowFrame.x = MATRIX_PAD;
    rowFrame.y = currentY;
    rowFrame.resize(TOTAL_W - MATRIX_PAD * 2, H);
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
    labelBox.resize(LABEL_W, H);

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
      const btn = await drawButtonCell(tokens, def.variant, state, def.size, def.icon, Boolean(def.isIconOnly), family);
      // centre vertically in the row
      btn.x = cellX + Math.round((COL_W - btn.width) / 2);
      btn.y = Math.round((H - btn.height) / 2);
      rowFrame.appendChild(btn);
      cellX += COL_W + COL_GAP;
    }

    currentY += H + ROW_GAP;
  }

  matrixBox.resize(TOTAL_W, currentY + MATRIX_PAD - ROW_GAP);

  return board;
}
