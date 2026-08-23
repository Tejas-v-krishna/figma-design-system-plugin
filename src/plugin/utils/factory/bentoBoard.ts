// Design System Bento Master Board Builder
// Implements the premier editorial Bento layout with 100% strict AutoLayout and Google Sans typography.
import { DesignTokens, GenerationConfig } from '../../../shared/types';
import { hexToRgb } from '../../../shared/color-utils';
import { ensureFont } from '../fonts';
import { makeFrame, pad, text, rect, ellipse, setFill, setStroke } from '../primitives';
import { colorShade } from '../tokenAccess';
import { StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';
import { buildIcon } from './templates';

export async function buildDesignSystemBentoBoard(
  tokens: DesignTokens,
  config: GenerationConfig,
  _styleMap?: StyleMap,
  _varMap?: VariableMap
): Promise<FrameNode> {
  const fontFam = 'Google Sans';
  const CW = 960;
  const board = makeFrame('Design System Overview');
  board.layoutMode = 'VERTICAL';
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.primaryAxisAlignItems = 'CENTER';
  board.counterAxisAlignItems = 'CENTER';
  board.resize(CW + 96, 100);
  board.itemSpacing = 36;
  pad(board, 48, 48);
  board.cornerRadius = 24;
  board.clipsContent = true;
  setFill(board, '#F8F7F4'); // Warm premier canvas background from Image 5

  // 1. Editorial Header
  const header = makeFrame('Header');
  header.layoutMode = 'VERTICAL';
  header.primaryAxisAlignItems = 'CENTER';
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisSizingMode = 'AUTO';
  header.counterAxisSizingMode = 'FIXED';
  header.resize(CW, 50);
  header.fills = [];

  let titleStr = config.brandName ? config.brandName.trim() : 'Design System';
  if (!titleStr.toLowerCase().includes('system') && !titleStr.toLowerCase().includes('design')) {
    titleStr = `${titleStr} Design System`;
  }

  const title = figma.createText();
  title.fontName = await ensureFont(fontFam, 700);
  title.fontSize = 36;
  title.letterSpacing = { value: -1, unit: 'PERCENT' };
  title.characters = titleStr;
  title.fills = [{ type: 'SOLID', color: hexToRgb('#1C1917') }];
  header.appendChild(title);

  board.appendChild(header);

  // 2. Bento Container Grid (Columns)
  const bentoGrid = makeFrame('Bento Grid');
  bentoGrid.layoutMode = 'HORIZONTAL';
  bentoGrid.primaryAxisAlignItems = 'MIN';
  bentoGrid.counterAxisAlignItems = 'MIN';
  bentoGrid.primaryAxisSizingMode = 'FIXED';
  bentoGrid.counterAxisSizingMode = 'AUTO';
  bentoGrid.itemSpacing = 24;
  bentoGrid.resize(CW, 100);
  bentoGrid.fills = [];

  const colWidth = (CW - 24) / 2; // 468px each

  const col1 = makeFrame('Col 1');
  col1.layoutMode = 'VERTICAL';
  col1.primaryAxisSizingMode = 'AUTO';
  col1.counterAxisSizingMode = 'FIXED';
  col1.itemSpacing = 24;
  col1.resize(colWidth, 100);
  col1.fills = [];

  const col2 = makeFrame('Col 2');
  col2.layoutMode = 'VERTICAL';
  col2.primaryAxisSizingMode = 'AUTO';
  col2.counterAxisSizingMode = 'FIXED';
  col2.itemSpacing = 24;
  col2.resize(colWidth, 100);
  col2.fills = [];

  // Helper to create a Bento Card
  const createBentoCard = (titleText: string): { card: FrameNode; body: FrameNode } => {
    const card = makeFrame(`Card - ${titleText}`);
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.resize(colWidth, 100);
    card.itemSpacing = 16;
    pad(card, 24, 24);
    card.cornerRadius = 20;
    card.clipsContent = true;  // prevent overflow from bleeding onto adjacent boards
    setFill(card, '#FFFFFF');
    setStroke(card, '#F1F0EC', 1);
    card.effects = [
      {
        type: 'DROP_SHADOW',
        color: { r: 0.1, g: 0.1, b: 0.1, a: 0.03 },
        offset: { x: 0, y: 3 },
        radius: 12,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];

    const label = text({
      characters: titleText,
      fontFamily: fontFam,
      weight: 600,
      fontSize: 11,
      fill: '#78716C',
    });
    card.appendChild(label);

    const body = makeFrame('Body');
    body.layoutMode = 'VERTICAL';
    body.primaryAxisSizingMode = 'AUTO';
    body.counterAxisSizingMode = 'FIXED';
    body.itemSpacing = 12;
    body.resize(colWidth - 48, 40);
    body.fills = [];
    body.clipsContent = false;  // body can still overflow within the card
    card.appendChild(body);

    return { card, body };
  };

  // Helper to create an AutoLayout Pill Capsule
  const makePillCapsule = (
    name: string,
    txt: string,
    bgHex: string,
    txtHex: string,
    weight = 600,
    fontSize = 12,
    borderHex?: string
  ): FrameNode => {
    const p = makeFrame(name);
    p.layoutMode = 'HORIZONTAL';
    p.primaryAxisAlignItems = 'CENTER';
    p.counterAxisAlignItems = 'CENTER';
    p.primaryAxisSizingMode = 'AUTO';
    p.counterAxisSizingMode = 'AUTO';
    pad(p, 8, 18);
    p.cornerRadius = 9999;
    setFill(p, bgHex);
    if (borderHex) setStroke(p, borderHex, 1.5);
    p.appendChild(text({ characters: txt, fontFamily: fontFam, weight, fontSize, fill: txtHex }));
    return p;
  };

  // ---------------- COLUMN 1 ----------------

  // 1. Card: Buttons
  const { card: btnCard, body: btnBody } = createBentoCard('Buttons');
  
  // Row 1: Solid black pill, White outline pill, Circle chevron, Circle filter
  const btnRow1 = makeFrame('Row 1');
  btnRow1.layoutMode = 'HORIZONTAL';
  btnRow1.counterAxisAlignItems = 'CENTER';
  btnRow1.primaryAxisSizingMode = 'AUTO';
  btnRow1.counterAxisSizingMode = 'AUTO';
  btnRow1.itemSpacing = 10;
  btnRow1.fills = [];

  btnRow1.appendChild(makePillCapsule('bBlack', 'Button', '#1C1917', '#FFFFFF', 600, 13));
  btnRow1.appendChild(makePillCapsule('bWhite', 'Button', '#FFFFFF', '#1C1917', 600, 13, '#1C1917'));

  const bChevron = makeFrame('bChevron');
  bChevron.layoutMode = 'HORIZONTAL';
  bChevron.primaryAxisAlignItems = 'CENTER';
  bChevron.counterAxisAlignItems = 'CENTER';
  bChevron.resize(36, 36);
  bChevron.cornerRadius = 9999;
  pad(bChevron, 0);
  setFill(bChevron, '#F5F5F4');
  bChevron.appendChild(buildIcon(14, '#44403C', 'chevronDown'));
  btnRow1.appendChild(bChevron);

  const bFilter = makeFrame('bFilter');
  bFilter.layoutMode = 'HORIZONTAL';
  bFilter.primaryAxisAlignItems = 'CENTER';
  bFilter.counterAxisAlignItems = 'CENTER';
  bFilter.resize(36, 36);
  bFilter.cornerRadius = 9999;
  pad(bFilter, 0);
  setFill(bFilter, '#F5F5F4');
  bFilter.appendChild(buildIcon(14, '#44403C', 'filter'));
  btnRow1.appendChild(bFilter);

  btnBody.appendChild(btnRow1);

  // Row 2: Soft beige button, Segmented pill toggle, Circle arrow
  const btnRow2 = makeFrame('Row 2');
  btnRow2.layoutMode = 'HORIZONTAL';
  btnRow2.counterAxisAlignItems = 'CENTER';
  btnRow2.primaryAxisSizingMode = 'AUTO';
  btnRow2.counterAxisSizingMode = 'AUTO';
  btnRow2.itemSpacing = 10;
  btnRow2.fills = [];

  btnRow2.appendChild(makePillCapsule('bBeige', 'Button', '#E7E5E4', '#44403C', 600, 13));

  const bToggle = makeFrame('bToggle');
  bToggle.layoutMode = 'HORIZONTAL';
  bToggle.counterAxisAlignItems = 'CENTER';
  bToggle.primaryAxisSizingMode = 'AUTO';
  bToggle.counterAxisSizingMode = 'AUTO';
  pad(bToggle, 3, 3);
  bToggle.cornerRadius = 9999;
  setFill(bToggle, '#F5F5F4');

  const bTog1 = makeFrame('bTog1');
  bTog1.layoutMode = 'HORIZONTAL';
  bTog1.counterAxisAlignItems = 'CENTER';
  bTog1.primaryAxisSizingMode = 'AUTO';
  bTog1.counterAxisSizingMode = 'AUTO';
  pad(bTog1, 6, 12);
  bTog1.cornerRadius = 9999;
  bTog1.fills = [];
  bTog1.appendChild(text({ characters: 'Button', fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#78716C' }));
  bToggle.appendChild(bTog1);

  const bTog2 = makeFrame('bTog2');
  bTog2.layoutMode = 'HORIZONTAL';
  bTog2.counterAxisAlignItems = 'CENTER';
  bTog2.primaryAxisSizingMode = 'AUTO';
  bTog2.counterAxisSizingMode = 'AUTO';
  pad(bTog2, 6, 12);
  bTog2.cornerRadius = 9999;
  setFill(bTog2, '#1C1917');
  bTog2.appendChild(text({ characters: 'Button', fontFamily: fontFam, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
  bToggle.appendChild(bTog2);

  btnRow2.appendChild(bToggle);

  const bArrow = makeFrame('bArrow');
  bArrow.layoutMode = 'HORIZONTAL';
  bArrow.primaryAxisAlignItems = 'CENTER';
  bArrow.counterAxisAlignItems = 'CENTER';
  bArrow.resize(36, 36);
  bArrow.cornerRadius = 9999;
  pad(bArrow, 0);
  setFill(bArrow, '#E7E5E4');
  bArrow.appendChild(buildIcon(14, '#44403C', 'arrowRight'));
  btnRow2.appendChild(bArrow);

  btnBody.appendChild(btnRow2);

  // Row 3: Buttons with icons (Download, + Add)
  const btnRow3 = makeFrame('Row 3');
  btnRow3.layoutMode = 'HORIZONTAL';
  btnRow3.counterAxisAlignItems = 'CENTER';
  btnRow3.primaryAxisSizingMode = 'AUTO';
  btnRow3.counterAxisSizingMode = 'AUTO';
  btnRow3.itemSpacing = 10;
  btnRow3.fills = [];

  const bDownload = makeFrame('bDownload');
  bDownload.layoutMode = 'HORIZONTAL';
  bDownload.counterAxisAlignItems = 'CENTER';
  bDownload.primaryAxisSizingMode = 'AUTO';
  bDownload.counterAxisSizingMode = 'AUTO';
  bDownload.itemSpacing = 6;
  pad(bDownload, 8, 16);
  bDownload.cornerRadius = 9999;
  setFill(bDownload, colorShade(tokens, 'primary', 500));
  bDownload.appendChild(text({ characters: 'Button', fontFamily: fontFam, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  bDownload.appendChild(buildIcon(14, '#FFFFFF', 'download'));
  btnRow3.appendChild(bDownload);

  const bPlus = makeFrame('bPlus');
  bPlus.layoutMode = 'HORIZONTAL';
  bPlus.counterAxisAlignItems = 'CENTER';
  bPlus.primaryAxisSizingMode = 'AUTO';
  bPlus.counterAxisSizingMode = 'AUTO';
  bPlus.itemSpacing = 6;
  pad(bPlus, 8, 16);
  bPlus.cornerRadius = 9999;
  setFill(bPlus, colorShade(tokens, 'primary', 500));
  bPlus.appendChild(buildIcon(14, '#FFFFFF', 'plus'));
  bPlus.appendChild(text({ characters: 'Button', fontFamily: fontFam, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  btnRow3.appendChild(bPlus);

  btnBody.appendChild(btnRow3);
  col1.appendChild(btnCard);

  // 2. Card: Breadcrumb & Bullets
  const { card: breadCard, body: breadBody } = createBentoCard('Breadcrumb & Indicators');
  
  const breadRow = makeFrame('breadRow');
  breadRow.layoutMode = 'HORIZONTAL';
  breadRow.counterAxisAlignItems = 'CENTER';
  breadRow.primaryAxisSizingMode = 'AUTO';
  breadRow.counterAxisSizingMode = 'AUTO';
  breadRow.itemSpacing = 8;
  breadRow.fills = [];
  breadRow.appendChild(text({ characters: 'Home Page', fontFamily: fontFam, weight: 600, fontSize: 13, fill: '#1C1917' }));
  breadRow.appendChild(text({ characters: '·', fontFamily: fontFam, weight: 700, fontSize: 14, fill: '#A8A29E' }));
  breadRow.appendChild(text({ characters: 'Case Study Details', fontFamily: fontFam, weight: 500, fontSize: 13, fill: '#78716C' }));
  breadBody.appendChild(breadRow);

  const bulletPill = makeFrame('bulletPill');
  bulletPill.layoutMode = 'HORIZONTAL';
  bulletPill.counterAxisAlignItems = 'CENTER';
  bulletPill.primaryAxisSizingMode = 'AUTO';
  bulletPill.counterAxisSizingMode = 'AUTO';
  bulletPill.itemSpacing = 8;
  pad(bulletPill, 8, 14);
  bulletPill.cornerRadius = 9999;
  setFill(bulletPill, '#F5F5F4');
  bulletPill.appendChild(buildIcon(14, '#1C1917', 'check'));
  bulletPill.appendChild(text({ characters: 'Highly professional deliverables', fontFamily: fontFam, weight: 600, fontSize: 12, fill: '#1C1917' }));
  breadBody.appendChild(bulletPill);

  col1.appendChild(breadCard);

  // 3. Card: Checkboxes & Radios
  const { card: formCtlCard, body: formCtlBody } = createBentoCard('Selection Controls');
  
  const iconSummaryRow = makeFrame('iconSummaryRow');
  iconSummaryRow.layoutMode = 'HORIZONTAL';
  iconSummaryRow.counterAxisAlignItems = 'CENTER';
  iconSummaryRow.primaryAxisSizingMode = 'AUTO';
  iconSummaryRow.counterAxisSizingMode = 'AUTO';
  iconSummaryRow.itemSpacing = 16;
  iconSummaryRow.fills = [];

  const cbSummary = makeFrame('cbSummary');
  cbSummary.layoutMode = 'HORIZONTAL';
  cbSummary.itemSpacing = 8;
  cbSummary.primaryAxisSizingMode = 'AUTO';
  cbSummary.counterAxisSizingMode = 'AUTO';
  cbSummary.fills = [];
  const cb1 = makeFrame('cb1'); cb1.layoutMode = 'HORIZONTAL'; cb1.resize(18, 18); cb1.cornerRadius = 4; setFill(cb1, '#1C1917'); cb1.primaryAxisAlignItems = 'CENTER'; cb1.counterAxisAlignItems = 'CENTER'; pad(cb1, 0); cb1.appendChild(buildIcon(12, '#FFFFFF', 'check'));
  const cb2 = makeFrame('cb2'); cb2.layoutMode = 'HORIZONTAL'; cb2.resize(18, 18); cb2.cornerRadius = 4; setFill(cb2, '#1C1917'); cb2.primaryAxisAlignItems = 'CENTER'; cb2.counterAxisAlignItems = 'CENTER'; pad(cb2, 0); cb2.appendChild(buildIcon(12, '#FFFFFF', 'minus'));
  const cb3 = makeFrame('cb3'); cb3.resize(18, 18); cb3.cornerRadius = 4; setFill(cb3, '#FFFFFF'); setStroke(cb3, '#D6D3D1', 1.5);
  cbSummary.appendChild(cb1); cbSummary.appendChild(cb2); cbSummary.appendChild(cb3);
  iconSummaryRow.appendChild(cbSummary);

  const rdSummary = makeFrame('rdSummary');
  rdSummary.layoutMode = 'HORIZONTAL';
  rdSummary.itemSpacing = 8;
  rdSummary.primaryAxisSizingMode = 'AUTO';
  rdSummary.counterAxisSizingMode = 'AUTO';
  rdSummary.fills = [];
  const rd1 = makeFrame('rd1'); rd1.layoutMode = 'HORIZONTAL'; rd1.resize(18, 18); rd1.cornerRadius = 9999; setFill(rd1, '#FFFFFF'); setStroke(rd1, '#1C1917', 2); rd1.primaryAxisAlignItems = 'CENTER'; rd1.counterAxisAlignItems = 'CENTER'; pad(rd1, 0); rd1.appendChild(ellipse('dot', 8, '#1C1917'));
  const rd2 = makeFrame('rd2'); rd2.resize(18, 18); rd2.cornerRadius = 9999; setFill(rd2, '#FFFFFF'); setStroke(rd2, '#D6D3D1', 1.5);
  rdSummary.appendChild(rd1); rdSummary.appendChild(rd2);
  iconSummaryRow.appendChild(rdSummary);
  formCtlBody.appendChild(iconSummaryRow);

  // 2-column checklist
  const checkGrid = makeFrame('checkGrid');
  checkGrid.layoutMode = 'HORIZONTAL';
  checkGrid.itemSpacing = 24;
  checkGrid.primaryAxisSizingMode = 'AUTO';
  checkGrid.counterAxisSizingMode = 'AUTO';
  checkGrid.fills = [];

  const cbCol1 = makeFrame('cbCol1'); cbCol1.layoutMode = 'VERTICAL'; cbCol1.itemSpacing = 8; cbCol1.primaryAxisSizingMode = 'AUTO'; cbCol1.counterAxisSizingMode = 'AUTO'; cbCol1.fills = [];
  const cbRowA = makeFrame('cbRowA'); cbRowA.layoutMode = 'HORIZONTAL'; cbRowA.counterAxisAlignItems = 'CENTER'; cbRowA.primaryAxisSizingMode = 'AUTO'; cbRowA.counterAxisSizingMode = 'AUTO'; cbRowA.itemSpacing = 6; cbRowA.fills = [];
  const cA = makeFrame('cA'); cA.layoutMode = 'HORIZONTAL'; cA.resize(16, 16); cA.cornerRadius = 4; setFill(cA, '#1C1917'); cA.primaryAxisAlignItems = 'CENTER'; cA.counterAxisAlignItems = 'CENTER'; pad(cA, 0); cA.appendChild(buildIcon(11, '#FFFFFF', 'check'));
  cbRowA.appendChild(cA); cbRowA.appendChild(text({ characters: 'Checked', fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#1C1917' }));
  cbCol1.appendChild(cbRowA);

  const cbRowB = makeFrame('cbRowB'); cbRowB.layoutMode = 'HORIZONTAL'; cbRowB.counterAxisAlignItems = 'CENTER'; cbRowB.primaryAxisSizingMode = 'AUTO'; cbRowB.counterAxisSizingMode = 'AUTO'; cbRowB.itemSpacing = 6; cbRowB.fills = [];
  const cB = makeFrame('cB'); cB.resize(16, 16); cB.cornerRadius = 4; setFill(cB, '#FFFFFF'); setStroke(cB, '#D6D3D1', 1.5);
  cbRowB.appendChild(cB); cbRowB.appendChild(text({ characters: 'Unchecked', fontFamily: fontFam, weight: 400, fontSize: 12, fill: '#78716C' }));
  cbCol1.appendChild(cbRowB);
  checkGrid.appendChild(cbCol1);

  const cbCol2 = makeFrame('cbCol2'); cbCol2.layoutMode = 'VERTICAL'; cbCol2.itemSpacing = 8; cbCol2.primaryAxisSizingMode = 'AUTO'; cbCol2.counterAxisSizingMode = 'AUTO'; cbCol2.fills = [];
  const cbRowC = makeFrame('cbRowC'); cbRowC.layoutMode = 'HORIZONTAL'; cbRowC.counterAxisAlignItems = 'CENTER'; cbRowC.primaryAxisSizingMode = 'AUTO'; cbRowC.counterAxisSizingMode = 'AUTO'; cbRowC.itemSpacing = 6; cbRowC.fills = []; cbRowC.opacity = 0.5;
  const cC = makeFrame('cC'); cC.layoutMode = 'HORIZONTAL'; cC.resize(16, 16); cC.cornerRadius = 4; setFill(cC, '#A8A29E'); cC.primaryAxisAlignItems = 'CENTER'; cC.counterAxisAlignItems = 'CENTER'; pad(cC, 0); cC.appendChild(buildIcon(11, '#FFFFFF', 'check'));
  cbRowC.appendChild(cC); cbRowC.appendChild(text({ characters: 'Disabled Checked', fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#78716C' }));
  cbCol2.appendChild(cbRowC);

  const cbRowD = makeFrame('cbRowD'); cbRowD.layoutMode = 'HORIZONTAL'; cbRowD.counterAxisAlignItems = 'CENTER'; cbRowD.primaryAxisSizingMode = 'AUTO'; cbRowD.counterAxisSizingMode = 'AUTO'; cbRowD.itemSpacing = 6; cbRowD.fills = []; cbRowD.opacity = 0.5;
  const cD = makeFrame('cD'); cD.resize(16, 16); cD.cornerRadius = 4; setFill(cD, '#F5F5F4'); setStroke(cD, '#D6D3D1', 1.5);
  cbRowD.appendChild(cD); cbRowD.appendChild(text({ characters: 'Disabled Unchecked', fontFamily: fontFam, weight: 400, fontSize: 12, fill: '#A8A29E' }));
  cbCol2.appendChild(cbRowD);
  checkGrid.appendChild(cbCol2);

  formCtlBody.appendChild(checkGrid);
  col1.appendChild(formCtlCard);

  // 4. Card: Text Inputs
  const { card: inputCard, body: inputBody } = createBentoCard('Text Inputs');

  // Pill Search Bar with embedded Budget dropdown pill
  const pillSearch = makeFrame('pillSearch');
  pillSearch.layoutMode = 'HORIZONTAL';
  pillSearch.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pillSearch.counterAxisAlignItems = 'CENTER';
  pillSearch.primaryAxisSizingMode = 'FIXED';
  pillSearch.counterAxisSizingMode = 'AUTO';
  pillSearch.resize(colWidth - 48, 44);
  pad(pillSearch, 4, 6, 4, 14);
  pillSearch.cornerRadius = 9999;
  setFill(pillSearch, '#FFFFFF');
  setStroke(pillSearch, '#E7E5E4', 1.5);

  const searchLeft = makeFrame('searchLeft');
  searchLeft.layoutMode = 'HORIZONTAL';
  searchLeft.counterAxisAlignItems = 'CENTER';
  searchLeft.primaryAxisSizingMode = 'AUTO';
  searchLeft.counterAxisSizingMode = 'AUTO';
  searchLeft.itemSpacing = 8;
  searchLeft.fills = [];
  searchLeft.appendChild(buildIcon(16, '#78716C', 'search'));
  searchLeft.appendChild(text({ characters: 'Search for Desktops', fontFamily: fontFam, weight: 500, fontSize: 13, fill: '#1C1917' }));
  pillSearch.appendChild(searchLeft);

  const budgetPill = makeFrame('budgetPill');
  budgetPill.layoutMode = 'HORIZONTAL';
  budgetPill.counterAxisAlignItems = 'CENTER';
  budgetPill.primaryAxisSizingMode = 'AUTO';
  budgetPill.counterAxisSizingMode = 'AUTO';
  budgetPill.itemSpacing = 4;
  pad(budgetPill, 6, 12);
  budgetPill.cornerRadius = 9999;
  setFill(budgetPill, '#F5F5F4');
  budgetPill.appendChild(text({ characters: 'Budget', fontFamily: fontFam, weight: 600, fontSize: 12, fill: '#44403C' }));
  budgetPill.appendChild(buildIcon(12, '#44403C', 'chevronDown'));
  pillSearch.appendChild(budgetPill);

  inputBody.appendChild(pillSearch);

  // Pill Search Bar with filter button
  const pillSearch2 = makeFrame('pillSearch2');
  pillSearch2.layoutMode = 'HORIZONTAL';
  pillSearch2.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pillSearch2.counterAxisAlignItems = 'CENTER';
  pillSearch2.primaryAxisSizingMode = 'FIXED';
  pillSearch2.counterAxisSizingMode = 'AUTO';
  pillSearch2.resize(colWidth - 48, 44);
  pad(pillSearch2, 4, 6, 4, 14);
  pillSearch2.cornerRadius = 9999;
  setFill(pillSearch2, '#FFFFFF');
  setStroke(pillSearch2, '#E7E5E4', 1.5);

  const s2Left = makeFrame('s2Left');
  s2Left.layoutMode = 'HORIZONTAL';
  s2Left.counterAxisAlignItems = 'CENTER';
  s2Left.primaryAxisSizingMode = 'AUTO';
  s2Left.counterAxisSizingMode = 'AUTO';
  s2Left.itemSpacing = 8;
  s2Left.fills = [];
  s2Left.appendChild(buildIcon(16, '#78716C', 'search'));
  s2Left.appendChild(text({ characters: 'Search for Mobiles', fontFamily: fontFam, weight: 500, fontSize: 13, fill: '#1C1917' }));
  pillSearch2.appendChild(s2Left);

  const filterBtn = makeFrame('filterBtn');
  filterBtn.layoutMode = 'HORIZONTAL';
  filterBtn.primaryAxisAlignItems = 'CENTER';
  filterBtn.counterAxisAlignItems = 'CENTER';
  filterBtn.resize(32, 32);
  filterBtn.cornerRadius = 9999;
  pad(filterBtn, 0);
  setFill(filterBtn, '#F5F5F4');
  filterBtn.appendChild(buildIcon(14, '#44403C', 'filter'));
  pillSearch2.appendChild(filterBtn);

  inputBody.appendChild(pillSearch2);

  // Dual Row: Inquiry Dropdown + Name field
  const dualRow = makeFrame('dualRow');
  dualRow.layoutMode = 'HORIZONTAL';
  dualRow.itemSpacing = 10;
  dualRow.primaryAxisSizingMode = 'FIXED';
  dualRow.counterAxisSizingMode = 'AUTO';
  dualRow.resize(colWidth - 48, 40);
  dualRow.fills = [];

  const inqDrop = makeFrame('inqDrop');
  inqDrop.layoutMode = 'HORIZONTAL';
  inqDrop.primaryAxisAlignItems = 'SPACE_BETWEEN';
  inqDrop.counterAxisAlignItems = 'CENTER';
  inqDrop.primaryAxisSizingMode = 'FIXED';
  inqDrop.counterAxisSizingMode = 'AUTO';
  pad(inqDrop, 10, 14);
  inqDrop.cornerRadius = 9999;
  setFill(inqDrop, '#F5F5F4');
  inqDrop.resize(230, 40);
  inqDrop.appendChild(text({ characters: 'What is your inquiry about?', fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#78716C' }));
  inqDrop.appendChild(buildIcon(12, '#78716C', 'chevronDown'));
  dualRow.appendChild(inqDrop);

  const nameInp = makeFrame('nameInp');
  nameInp.layoutMode = 'HORIZONTAL';
  nameInp.counterAxisAlignItems = 'CENTER';
  nameInp.primaryAxisSizingMode = 'FIXED';
  nameInp.counterAxisSizingMode = 'AUTO';
  pad(nameInp, 10, 14);
  nameInp.cornerRadius = 9999;
  setFill(nameInp, '#F5F5F4');
  nameInp.resize(colWidth - 48 - 240, 40);
  nameInp.appendChild(text({ characters: 'Name', fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#A8A29E' }));
  dualRow.appendChild(nameInp);

  inputBody.appendChild(dualRow);
  col1.appendChild(inputCard);

  // ---------------- COLUMN 2 ----------------

  // 5. Card: Tags & Badges
  const { card: tagCard, body: tagBody } = createBentoCard('Tags & Badges');
  
  const tagRow1 = makeFrame('tagRow1');
  tagRow1.layoutMode = 'HORIZONTAL';
  tagRow1.counterAxisAlignItems = 'CENTER';
  tagRow1.primaryAxisSizingMode = 'AUTO';
  tagRow1.counterAxisSizingMode = 'AUTO';
  tagRow1.itemSpacing = 8;
  tagRow1.fills = [];

  tagRow1.appendChild(makePillCapsule('tagOrange', 'ALL', '#EA580C', '#FFFFFF', 700, 11));
  tagRow1.appendChild(makePillCapsule('tagMood', 'MOODBOARD', '#F5F5F4', '#44403C', 600, 11));

  const tagRatings = makeFrame('tagRatings');
  tagRatings.layoutMode = 'HORIZONTAL';
  tagRatings.counterAxisAlignItems = 'CENTER';
  tagRatings.primaryAxisSizingMode = 'AUTO';
  tagRatings.counterAxisSizingMode = 'AUTO';
  tagRatings.itemSpacing = 4;
  pad(tagRatings, 8, 14);
  tagRatings.cornerRadius = 9999;
  setFill(tagRatings, '#F5F5F4');
  tagRatings.appendChild(text({ characters: 'Ratings', fontFamily: fontFam, weight: 600, fontSize: 11, fill: '#44403C' }));
  tagRatings.appendChild(buildIcon(11, '#44403C', 'chevronDown'));
  tagRow1.appendChild(tagRatings);

  tagBody.appendChild(tagRow1);

  const tagRow2 = makeFrame('tagRow2');
  tagRow2.layoutMode = 'HORIZONTAL';
  tagRow2.counterAxisAlignItems = 'CENTER';
  tagRow2.primaryAxisSizingMode = 'AUTO';
  tagRow2.counterAxisSizingMode = 'AUTO';
  tagRow2.itemSpacing = 8;
  tagRow2.fills = [];

  const tagClear = makeFrame('tagClear');
  tagClear.layoutMode = 'HORIZONTAL';
  tagClear.counterAxisAlignItems = 'CENTER';
  tagClear.primaryAxisSizingMode = 'AUTO';
  tagClear.counterAxisSizingMode = 'AUTO';
  tagClear.itemSpacing = 6;
  pad(tagClear, 6, 12);
  tagClear.cornerRadius = 9999;
  setFill(tagClear, '#FFFFFF');
  setStroke(tagClear, '#E7E5E4', 1.5);
  tagClear.appendChild(text({ characters: 'Clear All', fontFamily: fontFam, weight: 600, fontSize: 11, fill: '#44403C' }));
  tagClear.appendChild(buildIcon(10, '#78716C', 'close'));
  tagRow2.appendChild(tagClear);

  const tagArt = makeFrame('tagArt');
  tagArt.layoutMode = 'HORIZONTAL';
  tagArt.primaryAxisAlignItems = 'CENTER';
  tagArt.counterAxisAlignItems = 'CENTER';
  tagArt.primaryAxisSizingMode = 'AUTO';
  tagArt.counterAxisSizingMode = 'AUTO';
  pad(tagArt, 5, 8);
  tagArt.cornerRadius = 4;
  setFill(tagArt, '#F5F5F4');
  tagArt.appendChild(text({ characters: 'ART DECO', fontFamily: fontFam, weight: 600, fontSize: 10, fill: '#78716C' }));
  tagRow2.appendChild(tagArt);

  tagRow2.appendChild(makePillCapsule('tagSilver', 'SILVER', '#F5F5F4', '#78716C', 600, 10));

  tagBody.appendChild(tagRow2);
  col2.appendChild(tagCard);

  // 6. Card: Accordion
  const { card: accCard, body: accBody } = createBentoCard('Accordion');

  // Closed item
  const accItem1 = makeFrame('accItem1');
  accItem1.layoutMode = 'HORIZONTAL';
  accItem1.primaryAxisAlignItems = 'SPACE_BETWEEN';
  accItem1.counterAxisAlignItems = 'CENTER';
  accItem1.primaryAxisSizingMode = 'FIXED';
  accItem1.counterAxisSizingMode = 'AUTO';
  accItem1.resize(colWidth - 48, 48);
  pad(accItem1, 10, 16);
  accItem1.cornerRadius = 14;
  setFill(accItem1, '#F8F7F4');
  accItem1.appendChild(text({ characters: 'What is this design system?', fontFamily: fontFam, weight: 700, fontSize: 13, fill: '#1C1917' }));
  
  const plusCirc = makeFrame('plusCirc');
  plusCirc.layoutMode = 'HORIZONTAL';
  plusCirc.primaryAxisAlignItems = 'CENTER';
  plusCirc.counterAxisAlignItems = 'CENTER';
  plusCirc.resize(24, 24);
  plusCirc.cornerRadius = 9999;
  pad(plusCirc, 0);
  setFill(plusCirc, '#E7E5E4');
  plusCirc.appendChild(buildIcon(12, '#44403C', 'plus'));
  accItem1.appendChild(plusCirc);
  accBody.appendChild(accItem1);

  // Open item
  const accItem2 = makeFrame('accItem2');
  accItem2.layoutMode = 'VERTICAL';
  accItem2.itemSpacing = 8;
  accItem2.primaryAxisSizingMode = 'AUTO';
  accItem2.counterAxisSizingMode = 'FIXED';
  accItem2.resize(colWidth - 48, 100);
  pad(accItem2, 14, 16);
  accItem2.cornerRadius = 14;
  setFill(accItem2, '#F8F7F4');

  const accHead2 = makeFrame('accHead2');
  accHead2.layoutMode = 'HORIZONTAL';
  accHead2.primaryAxisAlignItems = 'SPACE_BETWEEN';
  accHead2.counterAxisAlignItems = 'CENTER';
  accHead2.primaryAxisSizingMode = 'FIXED';
  accHead2.counterAxisSizingMode = 'AUTO';
  accHead2.resize(colWidth - 80, 24);
  accHead2.fills = [];
  accHead2.appendChild(text({ characters: 'What makes this design system unique?', fontFamily: fontFam, weight: 700, fontSize: 13, fill: '#1C1917' }));

  const minusCirc = makeFrame('minusCirc');
  minusCirc.layoutMode = 'HORIZONTAL';
  minusCirc.primaryAxisAlignItems = 'CENTER';
  minusCirc.counterAxisAlignItems = 'CENTER';
  minusCirc.resize(24, 24);
  minusCirc.cornerRadius = 9999;
  pad(minusCirc, 0);
  setFill(minusCirc, '#E7E5E4');
  minusCirc.appendChild(buildIcon(12, '#44403C', 'minus'));
  accHead2.appendChild(minusCirc);
  accItem2.appendChild(accHead2);

  accItem2.appendChild(text({
    characters: 'Seamless token synchronization, responsive typography scales, and native DTCG 2025.10 export.',
    fontFamily: fontFam,
    weight: 400,
    fontSize: 12,
    fill: '#78716C',
  }));

  accBody.appendChild(accItem2);
  col2.appendChild(accCard);

  // 7. Card: Sliders & Segmented Controls
  const { card: sliderCard, body: sliderBody } = createBentoCard('Sliders & Segmented Controls');

  const sliderFrame = makeFrame('sliderFrame');
  sliderFrame.layoutMode = 'VERTICAL';
  sliderFrame.counterAxisAlignItems = 'MAX';
  sliderFrame.primaryAxisSizingMode = 'AUTO';
  sliderFrame.counterAxisSizingMode = 'FIXED';
  sliderFrame.itemSpacing = 4;
  sliderFrame.resize(colWidth - 48, 48);
  sliderFrame.fills = [];

  const valTooltip = makeFrame('valTooltip');
  valTooltip.layoutMode = 'HORIZONTAL';
  valTooltip.primaryAxisAlignItems = 'CENTER';
  valTooltip.counterAxisAlignItems = 'CENTER';
  valTooltip.primaryAxisSizingMode = 'AUTO';
  valTooltip.counterAxisSizingMode = 'AUTO';
  pad(valTooltip, 4, 8);
  valTooltip.cornerRadius = 6;
  setFill(valTooltip, '#1C1917');
  valTooltip.appendChild(text({ characters: 'Value (75%)', fontFamily: fontFam, weight: 600, fontSize: 11, fill: '#FFFFFF' }));
  sliderFrame.appendChild(valTooltip);

  const slTrack = makeFrame('slTrack');
  slTrack.layoutMode = 'HORIZONTAL';
  slTrack.primaryAxisSizingMode = 'FIXED';
  slTrack.counterAxisSizingMode = 'FIXED';
  slTrack.resize(colWidth - 48, 6);
  slTrack.cornerRadius = 9999;
  setFill(slTrack, '#E7E5E4');
  const slFill = rect('slFill', Math.round((colWidth - 48) * 0.75), 6, '#1C1917');
  slFill.cornerRadius = 9999;
  slTrack.appendChild(slFill);
  sliderFrame.appendChild(slTrack);

  sliderBody.appendChild(sliderFrame);

  // Segmented Pill Controls
  const segPill = makeFrame('segPill');
  segPill.layoutMode = 'HORIZONTAL';
  segPill.counterAxisAlignItems = 'CENTER';
  segPill.primaryAxisSizingMode = 'FIXED';
  segPill.counterAxisSizingMode = 'AUTO';
  pad(segPill, 4, 4);
  segPill.cornerRadius = 9999;
  segPill.resize(colWidth - 48, 38);
  setFill(segPill, '#F5F5F4');

  ['Label', 'Selected', 'Label'].forEach((lbl, i) => {
    const sItem = makeFrame(`sItem-${i}`);
    sItem.layoutMode = 'HORIZONTAL';
    sItem.primaryAxisAlignItems = 'CENTER';
    sItem.counterAxisAlignItems = 'CENTER';
    sItem.primaryAxisSizingMode = 'AUTO';
    sItem.counterAxisSizingMode = 'AUTO';
    pad(sItem, 6, 16);
    sItem.cornerRadius = 9999;
    if (i === 1) {
      setFill(sItem, '#1C1917');
      sItem.appendChild(text({ characters: lbl, fontFamily: fontFam, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
    } else {
      sItem.fills = [];
      sItem.appendChild(text({ characters: lbl, fontFamily: fontFam, weight: 500, fontSize: 12, fill: '#78716C' }));
    }
    segPill.appendChild(sItem);
  });
  sliderBody.appendChild(segPill);

  col2.appendChild(sliderCard);

  // 8. Card: Interactive Cells & Profile Cards
  const { card: cellCard, body: cellBody } = createBentoCard('Cells & Profile Cards');

  // Promo cell
  const promoCell = makeFrame('promoCell');
  promoCell.layoutMode = 'HORIZONTAL';
  promoCell.primaryAxisAlignItems = 'SPACE_BETWEEN';
  promoCell.counterAxisAlignItems = 'CENTER';
  promoCell.primaryAxisSizingMode = 'FIXED';
  promoCell.counterAxisSizingMode = 'AUTO';
  promoCell.resize(colWidth - 48, 58);
  pad(promoCell, 10, 16);
  promoCell.cornerRadius = 14;
  setFill(promoCell, '#FFFFFF');
  setStroke(promoCell, '#E7E5E4', 1);

  const promoLeft = makeFrame('promoLeft');
  promoLeft.layoutMode = 'HORIZONTAL';
  promoLeft.counterAxisAlignItems = 'CENTER';
  promoLeft.primaryAxisSizingMode = 'AUTO';
  promoLeft.counterAxisSizingMode = 'AUTO';
  promoLeft.itemSpacing = 12;
  promoLeft.fills = [];
  const promoIcon = makeFrame('promoIcon'); promoIcon.layoutMode = 'HORIZONTAL'; promoIcon.resize(32, 32); promoIcon.cornerRadius = 8; setFill(promoIcon, '#FEF3C7'); promoIcon.primaryAxisAlignItems = 'CENTER'; promoIcon.counterAxisAlignItems = 'CENTER'; pad(promoIcon, 0); promoIcon.appendChild(buildIcon(16, '#D97706', 'star'));
  promoLeft.appendChild(promoIcon);

  const promoTitles = makeFrame('promoTitles');
  promoTitles.layoutMode = 'VERTICAL';
  promoTitles.primaryAxisSizingMode = 'AUTO';
  promoTitles.counterAxisSizingMode = 'AUTO';
  promoTitles.itemSpacing = 2;
  promoTitles.fills = [];
  promoTitles.appendChild(text({ characters: "T&C's Bday Promotion", fontFamily: fontFam, weight: 700, fontSize: 13, fill: '#1C1917' }));
  promoTitles.appendChild(text({ characters: 'NOVEMBER 2026', fontFamily: fontFam, weight: 600, fontSize: 10, fill: '#A8A29E' }));
  promoLeft.appendChild(promoTitles);
  promoCell.appendChild(promoLeft);

  const promoArrow = makeFrame('promoArrow');
  promoArrow.layoutMode = 'HORIZONTAL';
  promoArrow.primaryAxisAlignItems = 'CENTER';
  promoArrow.counterAxisAlignItems = 'CENTER';
  promoArrow.resize(28, 28);
  promoArrow.cornerRadius = 9999;
  pad(promoArrow, 0);
  setFill(promoArrow, '#E7E5E4');
  promoArrow.appendChild(buildIcon(12, '#44403C', 'arrowRight'));
  promoCell.appendChild(promoArrow);

  cellBody.appendChild(promoCell);

  // User Profile Cell
  const userCell = makeFrame('userCell');
  userCell.layoutMode = 'HORIZONTAL';
  userCell.primaryAxisAlignItems = 'SPACE_BETWEEN';
  userCell.counterAxisAlignItems = 'CENTER';
  userCell.primaryAxisSizingMode = 'FIXED';
  userCell.counterAxisSizingMode = 'AUTO';
  userCell.resize(colWidth - 48, 64);
  pad(userCell, 10, 16);
  userCell.cornerRadius = 14;
  setFill(userCell, '#F8F7F4');

  const userLeft = makeFrame('userLeft');
  userLeft.layoutMode = 'HORIZONTAL';
  userLeft.counterAxisAlignItems = 'CENTER';
  userLeft.primaryAxisSizingMode = 'AUTO';
  userLeft.counterAxisSizingMode = 'AUTO';
  userLeft.itemSpacing = 12;
  userLeft.fills = [];

  const av = makeFrame('av');
  av.layoutMode = 'HORIZONTAL';
  av.resize(38, 38);
  av.cornerRadius = 9999;
  pad(av, 0);
  setFill(av, colorShade(tokens, 'primary', 500));
  av.primaryAxisAlignItems = 'CENTER';
  av.counterAxisAlignItems = 'CENTER';
  av.appendChild(text({ characters: 'JC', fontFamily: fontFam, weight: 700, fontSize: 13, fill: '#FFFFFF' }));
  userLeft.appendChild(av);

  const uTitles = makeFrame('uTitles');
  uTitles.layoutMode = 'VERTICAL';
  uTitles.primaryAxisSizingMode = 'AUTO';
  uTitles.counterAxisSizingMode = 'AUTO';
  uTitles.itemSpacing = 2;
  uTitles.fills = [];
  uTitles.appendChild(text({ characters: 'Jane Cooper', fontFamily: fontFam, weight: 700, fontSize: 13, fill: '#1C1917' }));
  uTitles.appendChild(text({ characters: 'Sydney • Available now', fontFamily: fontFam, weight: 500, fontSize: 11, fill: '#10B981' }));
  userLeft.appendChild(uTitles);
  userCell.appendChild(userLeft);

  const priceTag = makeFrame('priceTag');
  priceTag.layoutMode = 'HORIZONTAL';
  priceTag.primaryAxisAlignItems = 'CENTER';
  priceTag.counterAxisAlignItems = 'CENTER';
  priceTag.primaryAxisSizingMode = 'AUTO';
  priceTag.counterAxisSizingMode = 'AUTO';
  pad(priceTag, 6, 12);
  priceTag.cornerRadius = 9999;
  setFill(priceTag, '#E7E5E4');
  priceTag.appendChild(text({ characters: '$599', fontFamily: fontFam, weight: 700, fontSize: 12, fill: '#1C1917' }));
  userCell.appendChild(priceTag);

  cellBody.appendChild(userCell);
  col2.appendChild(cellCard);

  // Assemble grid
  bentoGrid.appendChild(col1);
  bentoGrid.appendChild(col2);
  board.appendChild(bentoGrid);

  // Bottom Pill (Image 5 style: "And more...")
  const btmPill = makePillCapsule('btmPill', 'And more…', '#E7E5E4', '#78716C', 600, 12);
  board.appendChild(btmPill);

  return board;
}
