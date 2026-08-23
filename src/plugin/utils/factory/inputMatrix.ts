// Input & Form Controls Matrix Board Builder
// Implements the 5-column inputs & form controls matrix with Google Sans, unclipped layout, and clean cells.
import { DesignTokens, GenerationConfig } from '../../../shared/types';
import { COMPONENT_DEFINITIONS } from '../../../shared/component-definitions';
import { hexToRgb } from '../../../shared/color-utils';
import { ensureFont } from '../fonts';
import { makeFrame, pad, text } from '../primitives';
import { colorShade } from '../tokenAccess';
import { StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';
import { TEMPLATES, TemplateCtx } from './templates';

export async function buildInputMatrixBoard(
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap?: StyleMap,
  varMap?: VariableMap
): Promise<FrameNode> {
  const fontFam = 'Google Sans';
  const CW = 960;
  const board = makeFrame('05. Inputs & Form Controls');
  board.layoutMode = 'VERTICAL';
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.clipsContent = false;
  board.resize(CW + 96, 100);
  board.itemSpacing = 28;
  pad(board, 48, 48);
  board.cornerRadius = 24;
  board.fills = [{ type: 'SOLID', color: hexToRgb('#F8FAFC') }];

  // 1. Header with green/primary section number
  const header = makeFrame('Header');
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';
  header.itemSpacing = 8;
  header.fills = [];

  const numTxt = figma.createText();
  numTxt.fontName = await ensureFont(fontFam, 700);
  numTxt.fontSize = 24;
  numTxt.characters = '05.';
  numTxt.fills = [{ type: 'SOLID', color: hexToRgb(colorShade(tokens, 'primary', 600)) }];
  header.appendChild(numTxt);

  const titleTxt = figma.createText();
  titleTxt.fontName = await ensureFont(fontFam, 700);
  titleTxt.fontSize = 24;
  titleTxt.characters = 'Inputs & Form Controls';
  titleTxt.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
  header.appendChild(titleTxt);

  board.appendChild(header);

  // 2. Matrix Box
  const matrixBox = makeFrame('Matrix Box');
  matrixBox.layoutMode = 'VERTICAL';
  matrixBox.primaryAxisSizingMode = 'AUTO';
  matrixBox.counterAxisSizingMode = 'FIXED';
  matrixBox.clipsContent = false;
  matrixBox.resize(CW, 100);
  matrixBox.itemSpacing = 10;
  pad(matrixBox, 32, 32);
  matrixBox.cornerRadius = 20;
  matrixBox.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  matrixBox.strokes = [{ type: 'SOLID', color: hexToRgb('#CBD5E1') }];
  matrixBox.strokeWeight = 1.5;
  matrixBox.dashPattern = [6, 6];

  // Column Headers: Default | Hover | Focused | Error | Disabled
  const headerRow = makeFrame('Header Row');
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.primaryAxisSizingMode = 'FIXED';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.itemSpacing = 16;
  headerRow.resize(CW - 64, 32);
  headerRow.fills = [];

  const spacer = makeFrame('Spacer');
  spacer.resize(150, 20);
  spacer.fills = [];
  headerRow.appendChild(spacer);

  const states = ['Default', 'Hover', 'Focus', 'Error', 'Disabled'];
  const colW = (CW - 64 - 150 - (states.length - 1) * 16) / states.length; // ~135px each

  for (const st of states) {
    const stLbl = text({
      characters: st === 'Focus' ? 'Focused' : st,
      fontFamily: fontFam,
      weight: 600,
      fontSize: 12,
      fill: '#94A3B8',
      align: 'CENTER',
    });
    stLbl.resize(colW, 20);
    headerRow.appendChild(stLbl);
  }
  matrixBox.appendChild(headerRow);

  const inputDef = COMPONENT_DEFINITIONS.find((d) => d.name === 'Input') ?? {
    name: 'Input',
    category: 'inputs',
    variants: [],
    states: [],
    sizes: [],
    options: {},
    defaultProps: {},
  };

  const inputTemplate = TEMPLATES['Input'];
  const textareaTemplate = TEMPLATES['Textarea'];

  const makeInputMatrixRow = (
    groupLabel: string,
    rowLabel: string,
    variantName: string,
    isTextarea?: boolean,
    isFirstInGroup?: boolean
  ): FrameNode => {
    const rowHeight = isTextarea ? 66 : 46;
    const row = makeFrame(`Row - ${groupLabel || 'item'} - ${rowLabel}`);
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 16;
    row.resize(CW - 64, rowHeight);
    row.fills = [];

    if (isFirstInGroup) {
      row.paddingTop = 12;
    }

    const labelBox = makeFrame('Label Box');
    labelBox.layoutMode = 'VERTICAL';
    labelBox.primaryAxisSizingMode = 'AUTO';
    labelBox.counterAxisSizingMode = 'AUTO';
    labelBox.itemSpacing = 2;
    labelBox.resize(150, 36);
    labelBox.fills = [];

    if (groupLabel) {
      labelBox.appendChild(text({
        characters: groupLabel,
        fontFamily: fontFam,
        weight: 700,
        fontSize: 13,
        fill: colorShade(tokens, 'primary', 600),
      }));
    }
    labelBox.appendChild(text({
      characters: rowLabel,
      fontFamily: fontFam,
      weight: 500,
      fontSize: 11,
      fill: '#94A3B8',
    }));
    row.appendChild(labelBox);

    for (const st of states) {
      const cell = makeFrame(`Cell - ${st}`);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'AUTO';
      cell.resize(colW, rowHeight);
      cell.fills = [];

      const node = figma.createComponent();
      node.name = `${isTextarea ? 'Textarea' : 'Input'}, Variant=${variantName}, State=${st}`;

      const ctx: TemplateCtx = {
        def: inputDef,
        tokens,
        config: {
          ...config,
          fontFamily: {
            ...config.fontFamily,
            body: fontFam,
            heading: fontFam,
          },
        },
        styleMap: styleMap ?? ({} as StyleMap),
        varMap,
        variantName,
        variantProps: {
          isMatrix: true,
        },
        stateName: st.toLowerCase(),
        stateProps: {},
        sizeName: 'md',
        sizeProps: {
          width: colW - 6,
          height: isTextarea ? 56 : 38,
          fontSize: 12,
        },
      };

      if (isTextarea && textareaTemplate) {
        textareaTemplate(node, ctx);
      } else if (inputTemplate) {
        inputTemplate(node, ctx);
      }

      cell.appendChild(node);
      row.appendChild(cell);
    }

    return row;
  };

  // Group 1: Text Inputs
  matrixBox.appendChild(makeInputMatrixRow('Text Inputs', 'Standard Field', 'default', false, true));
  matrixBox.appendChild(makeInputMatrixRow('', 'Email Input', 'email'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Password Mask', 'password'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Search Input', 'search'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Number Stepper', 'number'));

  // Group 2: Multiline Textarea
  matrixBox.appendChild(makeInputMatrixRow('Multiline Textarea', 'Standard Area', 'default', true, true));
  matrixBox.appendChild(makeInputMatrixRow('', 'Auto-Resize Handle', 'auto-resize', true));

  board.appendChild(matrixBox);
  return board;
}
