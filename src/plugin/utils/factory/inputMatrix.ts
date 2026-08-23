// Input & Form Controls Matrix Board Builder
// Implements the 5-column inputs & form controls matrix with Google Sans and strict AutoLayout.
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
  board.resize(CW + 96, 100);
  board.itemSpacing = 28;
  pad(board, 48, 48);
  board.cornerRadius = 24;
  board.fills = [{ type: 'SOLID', color: hexToRgb('#F8FAFC') }];

  // Header with green/primary section number
  const header = makeFrame('Header');
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'AUTO';
  header.itemSpacing = 8;
  header.resize(CW, 40);
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

  // Matrix Box
  const matrixBox = makeFrame('Matrix Box');
  matrixBox.layoutMode = 'VERTICAL';
  matrixBox.primaryAxisSizingMode = 'AUTO';
  matrixBox.counterAxisSizingMode = 'FIXED';
  matrixBox.resize(CW, 100);
  matrixBox.itemSpacing = 20;
  pad(matrixBox, 28, 28);
  matrixBox.cornerRadius = 20;
  matrixBox.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  matrixBox.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E8F0') }];
  matrixBox.strokeWeight = 1;
  matrixBox.dashPattern = [4, 4];

  // Column Headers: Default | Hover | Focused | Error | Disabled
  const headerRow = makeFrame('Header Row');
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.primaryAxisSizingMode = 'FIXED';
  headerRow.counterAxisSizingMode = 'AUTO';
  headerRow.itemSpacing = 16;
  headerRow.resize(CW - 56, 32);
  headerRow.fills = [];

  const spacer = makeFrame('Spacer');
  spacer.resize(160, 20);
  spacer.fills = [];
  headerRow.appendChild(spacer);

  const states = ['Default', 'Hover', 'Focus', 'Error', 'Disabled'];
  const colW = (CW - 56 - 160 - (states.length - 1) * 16) / states.length; // ~130px each

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
    isTextarea?: boolean
  ): FrameNode => {
    const row = makeFrame(`Row - ${groupLabel} - ${rowLabel}`);
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'AUTO';
    row.itemSpacing = 16;
    row.resize(CW - 56, isTextarea ? 80 : 54);
    row.fills = [];

    const labelBox = makeFrame('Label Box');
    labelBox.layoutMode = 'VERTICAL';
    labelBox.primaryAxisSizingMode = 'AUTO';
    labelBox.counterAxisSizingMode = 'AUTO';
    labelBox.itemSpacing = 2;
    labelBox.resize(160, isTextarea ? 60 : 40);
    labelBox.fills = [];

    if (groupLabel) {
      labelBox.appendChild(text({
        characters: groupLabel,
        fontFamily: fontFam,
        weight: 700,
        fontSize: 12,
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
      cell.resize(colW, isTextarea ? 76 : 50);
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
        variantProps: {},
        stateName: st.toLowerCase(),
        stateProps: {},
        sizeName: 'md',
        sizeProps: {
          height: isTextarea ? 64 : 38,
          fontSize: 12,
        },
      };

      if (isTextarea && textareaTemplate) {
        textareaTemplate(node, ctx);
      } else if (inputTemplate) {
        inputTemplate(node, ctx);
      }

      node.resize(Math.min(colW, 134), node.height);

      cell.appendChild(node);
      row.appendChild(cell);
    }

    return row;
  };

  // Group 1: Text Inputs
  matrixBox.appendChild(makeInputMatrixRow('Text Inputs', 'Standard Field', 'default'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Email Input', 'email'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Password Mask', 'password'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Search Input', 'search'));
  matrixBox.appendChild(makeInputMatrixRow('', 'Number Stepper', 'number'));

  // Group 2: Textarea
  matrixBox.appendChild(makeInputMatrixRow('Multiline Textarea', 'Standard Area', 'default', true));
  matrixBox.appendChild(makeInputMatrixRow('', 'Auto-Resize Handle', 'auto-resize', true));

  board.appendChild(matrixBox);
  return board;
}
