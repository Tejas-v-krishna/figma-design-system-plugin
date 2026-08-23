// Button Matrix Board Builder
// Implements the exact 5-column button state matrix from reference image 4.
import { DesignTokens, GenerationConfig } from '../../../shared/types';
import { COMPONENT_DEFINITIONS } from '../../../shared/component-definitions';
import { hexToRgb } from '../../../shared/color-utils';
import { ensureFont } from '../fonts';
import { makeFrame, pad, text } from '../primitives';
import { colorShade } from '../tokenAccess';
import { StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';
import { TEMPLATES, TemplateCtx } from './templates';

export async function buildButtonMatrixBoard(
  tokens: DesignTokens,
  config: GenerationConfig,
  styleMap?: StyleMap,
  varMap?: VariableMap
): Promise<FrameNode> {
  const CW = 960;
  const board = makeFrame('04. Buttons');
  board.layoutMode = 'VERTICAL';
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.resize(CW + 96, 1500);
  board.itemSpacing = 28;
  pad(board, 48, 48);
  board.cornerRadius = 24;
  board.fills = [{ type: 'SOLID', color: hexToRgb('#F8FAFC') }];

  // 1. Header with green/primary section number (Image 4 style)
  const header = makeFrame('Header');
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.itemSpacing = 8;
  header.resize(CW, 40);
  header.fills = [];

  const numTxt = figma.createText();
  numTxt.fontName = await ensureFont(config.fontFamily.heading, 700);
  numTxt.fontSize = 24;
  numTxt.characters = '04.';
  numTxt.fills = [{ type: 'SOLID', color: hexToRgb(colorShade(tokens, 'primary', 600)) }];
  header.appendChild(numTxt);

  const titleTxt = figma.createText();
  titleTxt.fontName = await ensureFont(config.fontFamily.heading, 700);
  titleTxt.fontSize = 24;
  titleTxt.characters = 'Buttons';
  titleTxt.fills = [{ type: 'SOLID', color: hexToRgb('#0F172A') }];
  header.appendChild(titleTxt);

  board.appendChild(header);

  // 2. Matrix Container Box with subtle dashed border (Image 4 style)
  const matrixBox = makeFrame('Matrix Box');
  matrixBox.layoutMode = 'VERTICAL';
  matrixBox.primaryAxisSizingMode = 'AUTO';
  matrixBox.counterAxisSizingMode = 'FIXED';
  matrixBox.resize(CW, 1200);
  matrixBox.itemSpacing = 24;
  pad(matrixBox, 28, 28);
  matrixBox.cornerRadius = 20;
  matrixBox.fills = [{ type: 'SOLID', color: hexToRgb('#FFFFFF') }];
  matrixBox.strokes = [{ type: 'SOLID', color: hexToRgb('#E2E8F0') }];
  matrixBox.strokeWeight = 1;
  matrixBox.dashPattern = [4, 4];

  // Top Column Headers: Default | Hover | Focused | Active | Disabled
  const headerRow = makeFrame('Header Row');
  headerRow.layoutMode = 'HORIZONTAL';
  headerRow.counterAxisAlignItems = 'CENTER';
  headerRow.itemSpacing = 16;
  headerRow.resize(CW - 56, 32);
  headerRow.fills = [];

  // Space for left row label column
  const spacer = makeFrame('Spacer');
  spacer.resize(160, 20);
  spacer.fills = [];
  headerRow.appendChild(spacer);

  const states = ['Default', 'Hover', 'Focused', 'Active', 'Disabled'];
  const colW = (CW - 56 - 160 - (states.length - 1) * 16) / states.length; // ~130px each

  for (const st of states) {
    const stLbl = text({
      characters: st,
      fontFamily: config.fontFamily.mono,
      weight: 600,
      fontSize: 12,
      fill: '#94A3B8',
      align: 'CENTER',
    });
    stLbl.resize(colW, 20);
    headerRow.appendChild(stLbl);
  }
  matrixBox.appendChild(headerRow);

  const btnDef = COMPONENT_DEFINITIONS.find((d) => d.name === 'Button') ?? {
    name: 'Button',
    category: 'buttons',
    variants: [],
    states: [],
    sizes: [],
    options: {},
    defaultProps: {},
  };

  const btnTemplate = TEMPLATES['Button'];
  const iconBtnTemplate = TEMPLATES['IconButton'];

  // Helper to build a matrix row
  const makeMatrixRow = (
    groupLabel: string,
    rowLabel: string,
    variantName: string,
    sizeName: string,
    iconPos?: 'left' | 'right' | 'none',
    isBlack?: boolean,
    isIconOnly?: boolean
  ): FrameNode => {
    const row = makeFrame(`Row - ${groupLabel} - ${rowLabel}`);
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 16;
    row.resize(CW - 56, 44);
    row.fills = [];

    // Left label column
    const labelBox = makeFrame('Label Box');
    labelBox.layoutMode = 'VERTICAL';
    labelBox.itemSpacing = 2;
    labelBox.resize(160, 40);
    labelBox.fills = [];

    if (groupLabel) {
      labelBox.appendChild(text({
        characters: groupLabel,
        fontFamily: config.fontFamily.body,
        weight: 700,
        fontSize: 12,
        fill: colorShade(tokens, 'primary', 600),
      }));
    }
    labelBox.appendChild(text({
      characters: rowLabel,
      fontFamily: config.fontFamily.body,
      weight: 500,
      fontSize: 11,
      fill: '#94A3B8',
    }));
    row.appendChild(labelBox);

    // 5 State cells
    for (const st of states) {
      const cell = makeFrame(`Cell - ${st}`);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.resize(colW, 44);
      cell.fills = [];

      const node = figma.createComponent();
      node.name = `Button, Variant=${variantName}, State=${st}, Size=${sizeName}`;
      
      const ctx: TemplateCtx = {
        def: btnDef,
        tokens,
        config,
        styleMap: styleMap ?? ({} as StyleMap),
        varMap,
        variantName,
        variantProps: {
          iconPosition: iconPos ?? 'none',
          isBlack: Boolean(isBlack),
        },
        stateName: st,
        stateProps: {},
        sizeName,
        sizeProps: {
          height: sizeName === 'sm' ? 32 : 44,
          fontSize: sizeName === 'sm' ? 12 : 14,
        },
      };

      if (isIconOnly && iconBtnTemplate) {
        iconBtnTemplate(node, ctx);
      } else if (btnTemplate) {
        btnTemplate(node, ctx);
      }

      cell.appendChild(node);
      row.appendChild(cell);
    }

    return row;
  };

  // Group 1: Primary Large
  matrixBox.appendChild(makeMatrixRow('Primary Large', 'Large', 'primary', 'lg', 'none'));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'primary', 'lg', 'right'));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'primary', 'lg', 'left'));

  // Group 2: Primary Small
  matrixBox.appendChild(makeMatrixRow('Primary Small', 'Small', 'primary', 'sm', 'none'));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'primary', 'sm', 'right'));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'primary', 'sm', 'left'));

  // Group 3: Secondary Large (Outline)
  matrixBox.appendChild(makeMatrixRow('Secondary Large', 'Large', 'outline', 'lg', 'none'));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'outline', 'lg', 'right'));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'outline', 'lg', 'left'));

  // Group 4: Secondary Small (Outline)
  matrixBox.appendChild(makeMatrixRow('Secondary Small', 'Small', 'outline', 'sm', 'none'));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'outline', 'sm', 'right'));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'outline', 'sm', 'left'));

  // Group 5: Tertiary Large (Ghost/Text)
  matrixBox.appendChild(makeMatrixRow('Tertiary Large', 'Large', 'tertiary', 'lg', 'none'));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'tertiary', 'lg', 'right'));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'tertiary', 'lg', 'left'));

  // Group 6: Black Large
  matrixBox.appendChild(makeMatrixRow('Black Large', 'Large', 'black', 'lg', 'none', true));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'black', 'lg', 'right', true));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'black', 'lg', 'left', true));

  // Group 7: Black Small
  matrixBox.appendChild(makeMatrixRow('Black Small', 'Small', 'black', 'sm', 'none', true));
  matrixBox.appendChild(makeMatrixRow('', 'icon right', 'black', 'sm', 'right', true));
  matrixBox.appendChild(makeMatrixRow('', 'icon left', 'black', 'sm', 'left', true));

  // Group 8: Black Icon Only
  matrixBox.appendChild(makeMatrixRow('Black Icon Only', 'Large', 'black', 'lg', 'none', true, true));
  matrixBox.appendChild(makeMatrixRow('', 'Small', 'black', 'sm', 'none', true, true));

  board.appendChild(matrixBox);
  return board;
}
