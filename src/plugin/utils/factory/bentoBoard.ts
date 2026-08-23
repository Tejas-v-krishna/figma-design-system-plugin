// Design System Bento Master Board Builder
// Implements the premier editorial Bento layout from reference image 5.
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
  const CW = 960;
  const board = makeFrame('Design System Overview');
  board.layoutMode = 'VERTICAL';
  board.primaryAxisSizingMode = 'AUTO';
  board.counterAxisSizingMode = 'FIXED';
  board.resize(CW + 96, 1200);
  board.itemSpacing = 40;
  pad(board, 48, 48);
  board.cornerRadius = 24;
  setFill(board, '#F8F7F4'); // Warm premier canvas background from Image 5

  // 1. Editorial Header
  const header = makeFrame('Header');
  header.layoutMode = 'VERTICAL';
  header.primaryAxisAlignItems = 'CENTER';
  header.counterAxisAlignItems = 'CENTER';
  header.itemSpacing = 8;
  header.resize(CW, 80);
  header.fills = [];

  const title = figma.createText();
  title.fontName = await ensureFont(config.fontFamily.heading, 700);
  title.fontSize = 38;
  title.letterSpacing = { value: -1, unit: 'PERCENT' };
  title.characters = `${config.brandName || 'Design'} System`;
  title.fills = [{ type: 'SOLID', color: hexToRgb('#1C1917') }];
  header.appendChild(title);

  board.appendChild(header);

  // 2. Bento Container Grid (Columns)
  const bentoGrid = makeFrame('Bento Grid');
  bentoGrid.layoutMode = 'HORIZONTAL';
  bentoGrid.itemSpacing = 24;
  bentoGrid.resize(CW, 900);
  bentoGrid.fills = [];

  const colWidth = (CW - 24) / 2; // 2 balanced columns: 468px each

  const col1 = makeFrame('Col 1');
  col1.layoutMode = 'VERTICAL';
  col1.itemSpacing = 24;
  col1.resize(colWidth, 900);
  col1.fills = [];

  const col2 = makeFrame('Col 2');
  col2.layoutMode = 'VERTICAL';
  col2.itemSpacing = 24;
  col2.resize(colWidth, 900);
  col2.fills = [];

  // Helper to create a Bento Card
  const createBentoCard = (titleText: string, height?: number): { card: FrameNode; body: FrameNode } => {
    const card = makeFrame(`Card - ${titleText}`);
    card.layoutMode = 'VERTICAL';
    card.primaryAxisSizingMode = 'AUTO';
    card.counterAxisSizingMode = 'FIXED';
    card.resize(colWidth, height ?? 100);
    card.itemSpacing = 16;
    pad(card, 24, 24);
    card.cornerRadius = 20;
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
      fontFamily: config.fontFamily.mono,
      weight: 600,
      fontSize: 11,
      fill: '#78716C',
    });
    card.appendChild(label);

    const body = makeFrame('Body');
    body.layoutMode = 'VERTICAL';
    body.itemSpacing = 12;
    body.resize(colWidth - 48, 40);
    body.fills = [];
    card.appendChild(body);

    return { card, body };
  };

  // ---------------- COLUMN 1 ----------------

  // Card: Buttons (Image 5 style)
  const { card: btnCard, body: btnBody } = createBentoCard('Buttons');
  
  // Row 1: Solid black pill, White outline pill, Circle chevron, Circle filter
  const btnRow1 = makeFrame('Row 1');
  btnRow1.layoutMode = 'HORIZONTAL';
  btnRow1.counterAxisAlignItems = 'CENTER';
  btnRow1.itemSpacing = 10;
  btnRow1.fills = [];

  const bBlack = makeFrame('bBlack');
  pad(bBlack, 10, 24);
  bBlack.cornerRadius = 9999;
  setFill(bBlack, '#1C1917');
  bBlack.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  btnRow1.appendChild(bBlack);

  const bWhite = makeFrame('bWhite');
  pad(bWhite, 10, 24);
  bWhite.cornerRadius = 9999;
  setFill(bWhite, '#FFFFFF');
  setStroke(bWhite, '#1C1917', 1.5);
  bWhite.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#1C1917' }));
  btnRow1.appendChild(bWhite);

  const bChevron = makeFrame('bChevron');
  bChevron.resize(36, 36);
  bChevron.cornerRadius = 9999;
  setFill(bChevron, '#F5F5F4');
  bChevron.primaryAxisAlignItems = 'CENTER';
  bChevron.counterAxisAlignItems = 'CENTER';
  bChevron.appendChild(buildIcon(14, '#44403C', 'chevronDown'));
  btnRow1.appendChild(bChevron);

  const bFilter = makeFrame('bFilter');
  bFilter.resize(36, 36);
  bFilter.cornerRadius = 9999;
  setFill(bFilter, '#F5F5F4');
  bFilter.primaryAxisAlignItems = 'CENTER';
  bFilter.counterAxisAlignItems = 'CENTER';
  bFilter.appendChild(buildIcon(14, '#44403C', 'filter'));
  btnRow1.appendChild(bFilter);

  btnBody.appendChild(btnRow1);

  // Row 2: Soft beige button, Segmented pill toggle, Circle arrow
  const btnRow2 = makeFrame('Row 2');
  btnRow2.layoutMode = 'HORIZONTAL';
  btnRow2.counterAxisAlignItems = 'CENTER';
  btnRow2.itemSpacing = 10;
  btnRow2.fills = [];

  const bBeige = makeFrame('bBeige');
  pad(bBeige, 10, 24);
  bBeige.cornerRadius = 9999;
  setFill(bBeige, '#E7E5E4');
  bBeige.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#44403C' }));
  btnRow2.appendChild(bBeige);

  const bToggle = makeFrame('bToggle');
  pad(bToggle, 3, 3);
  bToggle.cornerRadius = 9999;
  bToggle.layoutMode = 'HORIZONTAL';
  bToggle.counterAxisAlignItems = 'CENTER';
  setFill(bToggle, '#F5F5F4');

  const bTog1 = makeFrame('bTog1');
  pad(bTog1, 7, 14);
  bTog1.cornerRadius = 9999;
  bTog1.fills = [];
  bTog1.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#78716C' }));
  bToggle.appendChild(bTog1);

  const bTog2 = makeFrame('bTog2');
  pad(bTog2, 7, 14);
  bTog2.cornerRadius = 9999;
  setFill(bTog2, '#1C1917');
  bTog2.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
  bToggle.appendChild(bTog2);

  btnRow2.appendChild(bToggle);

  const bArrow = makeFrame('bArrow');
  bArrow.resize(36, 36);
  bArrow.cornerRadius = 9999;
  setFill(bArrow, '#E7E5E4');
  bArrow.primaryAxisAlignItems = 'CENTER';
  bArrow.counterAxisAlignItems = 'CENTER';
  bArrow.appendChild(buildIcon(14, '#44403C', 'arrowRight'));
  btnRow2.appendChild(bArrow);

  btnBody.appendChild(btnRow2);

  // Row 3: Buttons with icons (Download, + Add)
  const btnRow3 = makeFrame('Row 3');
  btnRow3.layoutMode = 'HORIZONTAL';
  btnRow3.counterAxisAlignItems = 'CENTER';
  btnRow3.itemSpacing = 10;
  btnRow3.fills = [];

  const bDownload = makeFrame('bDownload');
  bDownload.layoutMode = 'HORIZONTAL';
  bDownload.counterAxisAlignItems = 'CENTER';
  bDownload.itemSpacing = 6;
  pad(bDownload, 10, 20);
  bDownload.cornerRadius = 9999;
  setFill(bDownload, colorShade(tokens, 'primary', 500));
  bDownload.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  bDownload.appendChild(buildIcon(14, '#FFFFFF', 'download'));
  btnRow3.appendChild(bDownload);

  const bPlus = makeFrame('bPlus');
  bPlus.layoutMode = 'HORIZONTAL';
  bPlus.counterAxisAlignItems = 'CENTER';
  bPlus.itemSpacing = 6;
  pad(bPlus, 10, 20);
  bPlus.cornerRadius = 9999;
  setFill(bPlus, colorShade(tokens, 'primary', 500));
  bPlus.appendChild(buildIcon(14, '#FFFFFF', 'plus'));
  bPlus.appendChild(text({ characters: 'Button', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  btnRow3.appendChild(bPlus);

  btnBody.appendChild(btnRow3);
  col1.appendChild(btnCard);

  // Card: Breadcrumb & Bullets
  const { card: breadCard, body: breadBody } = createBentoCard('Breadcrumb & Indicators');
  
  const breadRow = makeFrame('breadRow');
  breadRow.layoutMode = 'HORIZONTAL';
  breadRow.counterAxisAlignItems = 'CENTER';
  breadRow.itemSpacing = 8;
  breadRow.fills = [];
  breadRow.appendChild(text({ characters: 'Home Page', fontFamily: config.fontFamily.body, weight: 600, fontSize: 13, fill: '#1C1917' }));
  breadRow.appendChild(text({ characters: '·', fontFamily: config.fontFamily.body, weight: 700, fontSize: 14, fill: '#A8A29E' }));
  breadRow.appendChild(text({ characters: 'Case Study Details', fontFamily: config.fontFamily.body, weight: 500, fontSize: 13, fill: '#78716C' }));
  breadBody.appendChild(breadRow);

  const bulletPill = makeFrame('bulletPill');
  bulletPill.layoutMode = 'HORIZONTAL';
  bulletPill.counterAxisAlignItems = 'CENTER';
  bulletPill.itemSpacing = 8;
  pad(bulletPill, 8, 14);
  bulletPill.cornerRadius = 9999;
  setFill(bulletPill, '#F5F5F4');
  bulletPill.appendChild(buildIcon(14, '#1C1917', 'check'));
  bulletPill.appendChild(text({ characters: 'Highly professional deliverables', fontFamily: config.fontFamily.body, weight: 600, fontSize: 12, fill: '#1C1917' }));
  breadBody.appendChild(bulletPill);

  col1.appendChild(breadCard);

  // Card: Checkboxes & Radios
  const { card: formCtlCard, body: formCtlBody } = createBentoCard('Selection Controls');
  
  const iconSummaryRow = makeFrame('iconSummaryRow');
  iconSummaryRow.layoutMode = 'HORIZONTAL';
  iconSummaryRow.counterAxisAlignItems = 'CENTER';
  iconSummaryRow.itemSpacing = 16;
  iconSummaryRow.fills = [];

  const cbSummary = makeFrame('cbSummary');
  cbSummary.layoutMode = 'HORIZONTAL';
  cbSummary.itemSpacing = 8;
  cbSummary.fills = [];
  const cb1 = makeFrame('cb1'); cb1.resize(18, 18); cb1.cornerRadius = 4; setFill(cb1, '#1C1917'); cb1.primaryAxisAlignItems = 'CENTER'; cb1.counterAxisAlignItems = 'CENTER'; cb1.appendChild(buildIcon(12, '#FFFFFF', 'check'));
  const cb2 = makeFrame('cb2'); cb2.resize(18, 18); cb2.cornerRadius = 4; setFill(cb2, '#1C1917'); cb2.primaryAxisAlignItems = 'CENTER'; cb2.counterAxisAlignItems = 'CENTER'; cb2.appendChild(buildIcon(12, '#FFFFFF', 'minus'));
  const cb3 = makeFrame('cb3'); cb3.resize(18, 18); cb3.cornerRadius = 4; setFill(cb3, '#FFFFFF'); setStroke(cb3, '#D6D3D1', 1.5);
  cbSummary.appendChild(cb1); cbSummary.appendChild(cb2); cbSummary.appendChild(cb3);
  iconSummaryRow.appendChild(cbSummary);

  const rdSummary = makeFrame('rdSummary');
  rdSummary.layoutMode = 'HORIZONTAL';
  rdSummary.itemSpacing = 8;
  rdSummary.fills = [];
  const rd1 = makeFrame('rd1'); rd1.resize(18, 18); rd1.cornerRadius = 9999; setFill(rd1, '#FFFFFF'); setStroke(rd1, '#1C1917', 2); rd1.primaryAxisAlignItems = 'CENTER'; rd1.counterAxisAlignItems = 'CENTER'; rd1.appendChild(ellipse('dot', 8, '#1C1917'));
  const rd2 = makeFrame('rd2'); rd2.resize(18, 18); rd2.cornerRadius = 9999; setFill(rd2, '#FFFFFF'); setStroke(rd2, '#D6D3D1', 1.5);
  rdSummary.appendChild(rd1); rdSummary.appendChild(rd2);
  iconSummaryRow.appendChild(rdSummary);
  formCtlBody.appendChild(iconSummaryRow);

  // 2-column checklist
  const checkGrid = makeFrame('checkGrid');
  checkGrid.layoutMode = 'HORIZONTAL';
  checkGrid.itemSpacing = 24;
  checkGrid.fills = [];

  const cbCol1 = makeFrame('cbCol1'); cbCol1.layoutMode = 'VERTICAL'; cbCol1.itemSpacing = 8; cbCol1.fills = [];
  const cbRowA = makeFrame('cbRowA'); cbRowA.layoutMode = 'HORIZONTAL'; cbRowA.counterAxisAlignItems = 'CENTER'; cbRowA.itemSpacing = 6; cbRowA.fills = [];
  const cA = makeFrame('cA'); cA.resize(16, 16); cA.cornerRadius = 4; setFill(cA, '#1C1917'); cA.primaryAxisAlignItems = 'CENTER'; cA.counterAxisAlignItems = 'CENTER'; cA.appendChild(buildIcon(11, '#FFFFFF', 'check'));
  cbRowA.appendChild(cA); cbRowA.appendChild(text({ characters: 'Checked', fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#1C1917' }));
  cbCol1.appendChild(cbRowA);

  const cbRowB = makeFrame('cbRowB'); cbRowB.layoutMode = 'HORIZONTAL'; cbRowB.counterAxisAlignItems = 'CENTER'; cbRowB.itemSpacing = 6; cbRowB.fills = [];
  const cB = makeFrame('cB'); cB.resize(16, 16); cB.cornerRadius = 4; setFill(cB, '#FFFFFF'); setStroke(cB, '#D6D3D1', 1.5);
  cbRowB.appendChild(cB); cbRowB.appendChild(text({ characters: 'Unchecked', fontFamily: config.fontFamily.body, weight: 400, fontSize: 12, fill: '#78716C' }));
  cbCol1.appendChild(cbRowB);
  checkGrid.appendChild(cbCol1);

  const cbCol2 = makeFrame('cbCol2'); cbCol2.layoutMode = 'VERTICAL'; cbCol2.itemSpacing = 8; cbCol2.fills = [];
  const cbRowC = makeFrame('cbRowC'); cbRowC.layoutMode = 'HORIZONTAL'; cbRowC.counterAxisAlignItems = 'CENTER'; cbRowC.itemSpacing = 6; cbRowC.fills = []; cbRowC.opacity = 0.5;
  const cC = makeFrame('cC'); cC.resize(16, 16); cC.cornerRadius = 4; setFill(cC, '#A8A29E'); cC.primaryAxisAlignItems = 'CENTER'; cC.counterAxisAlignItems = 'CENTER'; cC.appendChild(buildIcon(11, '#FFFFFF', 'check'));
  cbRowC.appendChild(cC); cbRowC.appendChild(text({ characters: 'Disabled Checked', fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#78716C' }));
  cbCol2.appendChild(cbRowC);

  const cbRowD = makeFrame('cbRowD'); cbRowD.layoutMode = 'HORIZONTAL'; cbRowD.counterAxisAlignItems = 'CENTER'; cbRowD.itemSpacing = 6; cbRowD.fills = []; cbRowD.opacity = 0.5;
  const cD = makeFrame('cD'); cD.resize(16, 16); cD.cornerRadius = 4; setFill(cD, '#F5F5F4'); setStroke(cD, '#D6D3D1', 1.5);
  cbRowD.appendChild(cD); cbRowD.appendChild(text({ characters: 'Disabled Unchecked', fontFamily: config.fontFamily.body, weight: 400, fontSize: 12, fill: '#A8A29E' }));
  cbCol2.appendChild(cbRowD);
  checkGrid.appendChild(cbCol2);

  formCtlBody.appendChild(checkGrid);
  col1.appendChild(formCtlCard);

  // Card: Text Inputs (Image 5 style)
  const { card: inputCard, body: inputBody } = createBentoCard('Text Inputs');

  // Pill Search Bar with embedded Budget dropdown pill
  const pillSearch = makeFrame('pillSearch');
  pillSearch.layoutMode = 'HORIZONTAL';
  pillSearch.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pillSearch.counterAxisAlignItems = 'CENTER';
  pillSearch.resize(colWidth - 48, 44);
  pad(pillSearch, 4, 14);
  pillSearch.cornerRadius = 9999;
  setFill(pillSearch, '#FFFFFF');
  setStroke(pillSearch, '#E7E5E4', 1.5);

  const searchLeft = makeFrame('searchLeft');
  searchLeft.layoutMode = 'HORIZONTAL';
  searchLeft.counterAxisAlignItems = 'CENTER';
  searchLeft.itemSpacing = 8;
  searchLeft.fills = [];
  searchLeft.appendChild(buildIcon(16, '#78716C', 'search'));
  searchLeft.appendChild(text({ characters: 'Search for Desktops', fontFamily: config.fontFamily.body, weight: 500, fontSize: 13, fill: '#1C1917' }));
  pillSearch.appendChild(searchLeft);

  const budgetPill = makeFrame('budgetPill');
  budgetPill.layoutMode = 'HORIZONTAL';
  budgetPill.counterAxisAlignItems = 'CENTER';
  budgetPill.itemSpacing = 4;
  pad(budgetPill, 6, 12);
  budgetPill.cornerRadius = 9999;
  setFill(budgetPill, '#F5F5F4');
  budgetPill.appendChild(text({ characters: 'Budget', fontFamily: config.fontFamily.body, weight: 600, fontSize: 12, fill: '#44403C' }));
  budgetPill.appendChild(buildIcon(12, '#44403C', 'chevronDown'));
  pillSearch.appendChild(budgetPill);

  inputBody.appendChild(pillSearch);

  // Pill Search Bar with filter button
  const pillSearch2 = makeFrame('pillSearch2');
  pillSearch2.layoutMode = 'HORIZONTAL';
  pillSearch2.primaryAxisAlignItems = 'SPACE_BETWEEN';
  pillSearch2.counterAxisAlignItems = 'CENTER';
  pillSearch2.resize(colWidth - 48, 44);
  pad(pillSearch2, 4, 14);
  pillSearch2.cornerRadius = 9999;
  setFill(pillSearch2, '#FFFFFF');
  setStroke(pillSearch2, '#E7E5E4', 1.5);

  const s2Left = makeFrame('s2Left');
  s2Left.layoutMode = 'HORIZONTAL';
  s2Left.counterAxisAlignItems = 'CENTER';
  s2Left.itemSpacing = 8;
  s2Left.fills = [];
  s2Left.appendChild(buildIcon(16, '#78716C', 'search'));
  s2Left.appendChild(text({ characters: 'Search for Mobiles', fontFamily: config.fontFamily.body, weight: 500, fontSize: 13, fill: '#1C1917' }));
  pillSearch2.appendChild(s2Left);

  const filterBtn = makeFrame('filterBtn');
  filterBtn.resize(32, 32);
  filterBtn.cornerRadius = 9999;
  setFill(filterBtn, '#F5F5F4');
  filterBtn.primaryAxisAlignItems = 'CENTER';
  filterBtn.counterAxisAlignItems = 'CENTER';
  filterBtn.appendChild(buildIcon(14, '#44403C', 'filter'));
  pillSearch2.appendChild(filterBtn);

  inputBody.appendChild(pillSearch2);

  // Dual Row: Inquiry Dropdown + Name field
  const dualRow = makeFrame('dualRow');
  dualRow.layoutMode = 'HORIZONTAL';
  dualRow.itemSpacing = 10;
  dualRow.resize(colWidth - 48, 40);
  dualRow.fills = [];

  const inqDrop = makeFrame('inqDrop');
  inqDrop.layoutMode = 'HORIZONTAL';
  inqDrop.primaryAxisAlignItems = 'SPACE_BETWEEN';
  inqDrop.counterAxisAlignItems = 'CENTER';
  pad(inqDrop, 10, 14);
  inqDrop.cornerRadius = 9999;
  setFill(inqDrop, '#F5F5F4');
  inqDrop.resize(230, 40);
  inqDrop.appendChild(text({ characters: 'What is your inquiry about?', fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#78716C' }));
  inqDrop.appendChild(buildIcon(12, '#78716C', 'chevronDown'));
  dualRow.appendChild(inqDrop);

  const nameInp = makeFrame('nameInp');
  pad(nameInp, 10, 14);
  nameInp.cornerRadius = 9999;
  setFill(nameInp, '#F5F5F4');
  nameInp.resize(170, 40);
  nameInp.appendChild(text({ characters: 'Name', fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#A8A29E' }));
  dualRow.appendChild(nameInp);

  inputBody.appendChild(dualRow);
  col1.appendChild(inputCard);

  // ---------------- COLUMN 2 ----------------

  // Card: Tags & Badges
  const { card: tagCard, body: tagBody } = createBentoCard('Tags & Badges');
  
  const tagRow1 = makeFrame('tagRow1');
  tagRow1.layoutMode = 'HORIZONTAL';
  tagRow1.counterAxisAlignItems = 'CENTER';
  tagRow1.itemSpacing = 8;
  tagRow1.fills = [];

  const tagOrange = makeFrame('tagOrange');
  pad(tagOrange, 6, 14);
  tagOrange.cornerRadius = 9999;
  setFill(tagOrange, '#EA580C');
  tagOrange.appendChild(text({ characters: 'ALL', fontFamily: config.fontFamily.body, weight: 700, fontSize: 11, fill: '#FFFFFF' }));
  tagRow1.appendChild(tagOrange);

  const tagMood = makeFrame('tagMood');
  pad(tagMood, 6, 14);
  tagMood.cornerRadius = 9999;
  setFill(tagMood, '#F5F5F4');
  tagMood.appendChild(text({ characters: 'MOODBOARD', fontFamily: config.fontFamily.body, weight: 600, fontSize: 11, fill: '#44403C' }));
  tagRow1.appendChild(tagMood);

  const tagRatings = makeFrame('tagRatings');
  tagRatings.layoutMode = 'HORIZONTAL';
  tagRatings.counterAxisAlignItems = 'CENTER';
  tagRatings.itemSpacing = 4;
  pad(tagRatings, 6, 14);
  tagRatings.cornerRadius = 9999;
  setFill(tagRatings, '#F5F5F4');
  tagRatings.appendChild(text({ characters: 'Ratings', fontFamily: config.fontFamily.body, weight: 600, fontSize: 11, fill: '#44403C' }));
  tagRatings.appendChild(buildIcon(11, '#44403C', 'chevronDown'));
  tagRow1.appendChild(tagRatings);

  tagBody.appendChild(tagRow1);

  const tagRow2 = makeFrame('tagRow2');
  tagRow2.layoutMode = 'HORIZONTAL';
  tagRow2.counterAxisAlignItems = 'CENTER';
  tagRow2.itemSpacing = 8;
  tagRow2.fills = [];

  const tagClear = makeFrame('tagClear');
  tagClear.layoutMode = 'HORIZONTAL';
  tagClear.counterAxisAlignItems = 'CENTER';
  tagClear.itemSpacing = 6;
  pad(tagClear, 5, 12);
  tagClear.cornerRadius = 9999;
  setFill(tagClear, '#FFFFFF');
  setStroke(tagClear, '#E7E5E4', 1.5);
  tagClear.appendChild(text({ characters: 'Clear All', fontFamily: config.fontFamily.body, weight: 600, fontSize: 11, fill: '#44403C' }));
  tagClear.appendChild(buildIcon(10, '#78716C', 'close'));
  tagRow2.appendChild(tagClear);

  const tagArt = makeFrame('tagArt');
  pad(tagArt, 4, 8);
  tagArt.cornerRadius = 4;
  setFill(tagArt, '#F5F5F4');
  tagArt.appendChild(text({ characters: 'ART DECO', fontFamily: config.fontFamily.mono, weight: 600, fontSize: 10, fill: '#78716C' }));
  tagRow2.appendChild(tagArt);

  const tagSilver = makeFrame('tagSilver');
  pad(tagSilver, 4, 8);
  tagSilver.cornerRadius = 9999;
  setFill(tagSilver, '#F5F5F4');
  tagSilver.appendChild(text({ characters: 'SILVER', fontFamily: config.fontFamily.mono, weight: 600, fontSize: 10, fill: '#78716C' }));
  tagRow2.appendChild(tagSilver);

  tagBody.appendChild(tagRow2);
  col2.appendChild(tagCard);

  // Card: Accordion (Image 5 style)
  const { card: accCard, body: accBody } = createBentoCard('Accordion');

  // Closed item
  const accItem1 = makeFrame('accItem1');
  accItem1.layoutMode = 'HORIZONTAL';
  accItem1.primaryAxisAlignItems = 'SPACE_BETWEEN';
  accItem1.counterAxisAlignItems = 'CENTER';
  accItem1.resize(colWidth - 48, 48);
  pad(accItem1, 10, 16);
  accItem1.cornerRadius = 14;
  setFill(accItem1, '#F8F7F4');
  accItem1.appendChild(text({ characters: 'What is this design system?', fontFamily: config.fontFamily.heading, weight: 700, fontSize: 13, fill: '#1C1917' }));
  
  const plusCirc = makeFrame('plusCirc');
  plusCirc.resize(24, 24);
  plusCirc.cornerRadius = 9999;
  setFill(plusCirc, '#E7E5E4');
  plusCirc.primaryAxisAlignItems = 'CENTER';
  plusCirc.counterAxisAlignItems = 'CENTER';
  plusCirc.appendChild(buildIcon(12, '#44403C', 'plus'));
  accItem1.appendChild(plusCirc);
  accBody.appendChild(accItem1);

  // Open item
  const accItem2 = makeFrame('accItem2');
  accItem2.layoutMode = 'VERTICAL';
  accItem2.itemSpacing = 10;
  accItem2.resize(colWidth - 48, 90);
  pad(accItem2, 14, 16);
  accItem2.cornerRadius = 14;
  setFill(accItem2, '#F8F7F4');

  const accHead2 = makeFrame('accHead2');
  accHead2.layoutMode = 'HORIZONTAL';
  accHead2.primaryAxisAlignItems = 'SPACE_BETWEEN';
  accHead2.counterAxisAlignItems = 'CENTER';
  accHead2.resize(colWidth - 80, 24);
  accHead2.fills = [];
  accHead2.appendChild(text({ characters: 'What makes this design system unique?', fontFamily: config.fontFamily.heading, weight: 700, fontSize: 13, fill: '#1C1917' }));

  const minusCirc = makeFrame('minusCirc');
  minusCirc.resize(24, 24);
  minusCirc.cornerRadius = 9999;
  setFill(minusCirc, '#E7E5E4');
  minusCirc.primaryAxisAlignItems = 'CENTER';
  minusCirc.counterAxisAlignItems = 'CENTER';
  minusCirc.appendChild(buildIcon(12, '#44403C', 'minus'));
  accHead2.appendChild(minusCirc);
  accItem2.appendChild(accHead2);

  accItem2.appendChild(text({
    characters: 'Seamless token synchronization, responsive typography scales, and native DTCG 2025.10 export.',
    fontFamily: config.fontFamily.body,
    weight: 400,
    fontSize: 12,
    fill: '#78716C',
  }));

  accBody.appendChild(accItem2);
  col2.appendChild(accCard);

  // Card: Sliders & Segmented Controls
  const { card: sliderCard, body: sliderBody } = createBentoCard('Sliders & Segmented Controls');

  // Slider with floating black Value tooltip
  const sliderFrame = makeFrame('sliderFrame');
  sliderFrame.layoutMode = 'VERTICAL';
  sliderFrame.counterAxisAlignItems = 'MAX';
  sliderFrame.itemSpacing = 4;
  sliderFrame.resize(colWidth - 48, 48);
  sliderFrame.fills = [];

  const valTooltip = makeFrame('valTooltip');
  pad(valTooltip, 4, 8);
  valTooltip.cornerRadius = 6;
  setFill(valTooltip, '#1C1917');
  valTooltip.appendChild(text({ characters: 'Value (75%)', fontFamily: config.fontFamily.body, weight: 600, fontSize: 11, fill: '#FFFFFF' }));
  sliderFrame.appendChild(valTooltip);

  const slTrack = makeFrame('slTrack');
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
  pad(segPill, 4, 4);
  segPill.cornerRadius = 9999;
  segPill.layoutMode = 'HORIZONTAL';
  segPill.counterAxisAlignItems = 'CENTER';
  segPill.resize(colWidth - 48, 38);
  setFill(segPill, '#F5F5F4');

  ['Label', 'Selected', 'Label'].forEach((lbl, i) => {
    const sItem = makeFrame(`sItem-${i}`);
    pad(sItem, 6, 16);
    sItem.cornerRadius = 9999;
    if (i === 1) {
      setFill(sItem, '#1C1917');
      sItem.appendChild(text({ characters: lbl, fontFamily: config.fontFamily.body, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
    } else {
      sItem.fills = [];
      sItem.appendChild(text({ characters: lbl, fontFamily: config.fontFamily.body, weight: 500, fontSize: 12, fill: '#78716C' }));
    }
    segPill.appendChild(sItem);
  });
  sliderBody.appendChild(segPill);

  col2.appendChild(sliderCard);

  // Card: Interactive Cells & Profile Cards
  const { card: cellCard, body: cellBody } = createBentoCard('Cells & Profile Cards');

  // Promo cell
  const promoCell = makeFrame('promoCell');
  promoCell.layoutMode = 'HORIZONTAL';
  promoCell.primaryAxisAlignItems = 'SPACE_BETWEEN';
  promoCell.counterAxisAlignItems = 'CENTER';
  promoCell.resize(colWidth - 48, 56);
  pad(promoCell, 10, 16);
  promoCell.cornerRadius = 14;
  setFill(promoCell, '#FFFFFF');
  setStroke(promoCell, '#E7E5E4', 1);

  const promoLeft = makeFrame('promoLeft');
  promoLeft.layoutMode = 'HORIZONTAL';
  promoLeft.counterAxisAlignItems = 'CENTER';
  promoLeft.itemSpacing = 12;
  promoLeft.fills = [];
  const promoIcon = makeFrame('promoIcon'); promoIcon.resize(32, 32); promoIcon.cornerRadius = 8; setFill(promoIcon, '#FEF3C7'); promoIcon.primaryAxisAlignItems = 'CENTER'; promoIcon.counterAxisAlignItems = 'CENTER'; promoIcon.appendChild(buildIcon(16, '#D97706', 'star'));
  promoLeft.appendChild(promoIcon);

  const promoTitles = makeFrame('promoTitles');
  promoTitles.layoutMode = 'VERTICAL';
  promoTitles.itemSpacing = 2;
  promoTitles.fills = [];
  promoTitles.appendChild(text({ characters: "T&C's Bday Promotion", fontFamily: config.fontFamily.heading, weight: 700, fontSize: 13, fill: '#1C1917' }));
  promoTitles.appendChild(text({ characters: 'NOVEMBER 2026', fontFamily: config.fontFamily.mono, weight: 600, fontSize: 10, fill: '#A8A29E' }));
  promoLeft.appendChild(promoTitles);
  promoCell.appendChild(promoLeft);

  const promoArrow = makeFrame('promoArrow');
  promoArrow.resize(28, 28);
  promoArrow.cornerRadius = 9999;
  setFill(promoArrow, '#E7E5E4');
  promoArrow.primaryAxisAlignItems = 'CENTER';
  promoArrow.counterAxisAlignItems = 'CENTER';
  promoArrow.appendChild(buildIcon(12, '#44403C', 'arrowRight'));
  promoCell.appendChild(promoArrow);

  cellBody.appendChild(promoCell);

  // User Profile Cell
  const userCell = makeFrame('userCell');
  userCell.layoutMode = 'HORIZONTAL';
  userCell.primaryAxisAlignItems = 'SPACE_BETWEEN';
  userCell.counterAxisAlignItems = 'CENTER';
  userCell.resize(colWidth - 48, 64);
  pad(userCell, 10, 16);
  userCell.cornerRadius = 14;
  setFill(userCell, '#F8F7F4');

  const userLeft = makeFrame('userLeft');
  userLeft.layoutMode = 'HORIZONTAL';
  userLeft.counterAxisAlignItems = 'CENTER';
  userLeft.itemSpacing = 12;
  userLeft.fills = [];

  const av = makeFrame('av');
  av.resize(38, 38);
  av.cornerRadius = 9999;
  setFill(av, colorShade(tokens, 'primary', 500));
  av.primaryAxisAlignItems = 'CENTER';
  av.counterAxisAlignItems = 'CENTER';
  av.appendChild(text({ characters: 'JC', fontFamily: config.fontFamily.heading, weight: 700, fontSize: 13, fill: '#FFFFFF' }));
  userLeft.appendChild(av);

  const uTitles = makeFrame('uTitles');
  uTitles.layoutMode = 'VERTICAL';
  uTitles.itemSpacing = 2;
  uTitles.fills = [];
  uTitles.appendChild(text({ characters: 'Jane Cooper', fontFamily: config.fontFamily.heading, weight: 700, fontSize: 13, fill: '#1C1917' }));
  uTitles.appendChild(text({ characters: 'Sydney • Available now', fontFamily: config.fontFamily.body, weight: 500, fontSize: 11, fill: '#10B981' }));
  userLeft.appendChild(uTitles);
  userCell.appendChild(userLeft);

  const priceTag = makeFrame('priceTag');
  pad(priceTag, 6, 12);
  priceTag.cornerRadius = 9999;
  setFill(priceTag, '#E7E5E4');
  priceTag.appendChild(text({ characters: '$599', fontFamily: config.fontFamily.body, weight: 700, fontSize: 12, fill: '#1C1917' }));
  userCell.appendChild(priceTag);

  cellBody.appendChild(userCell);
  col2.appendChild(cellCard);

  // Assemble grid
  bentoGrid.appendChild(col1);
  bentoGrid.appendChild(col2);
  board.appendChild(bentoGrid);

  // Bottom Pill (Image 5 style: "And more...")
  const btmPill = makeFrame('btmPill');
  pad(btmPill, 8, 20);
  btmPill.cornerRadius = 9999;
  setFill(btmPill, '#E7E5E4');
  btmPill.appendChild(text({ characters: 'And more…', fontFamily: config.fontFamily.body, weight: 600, fontSize: 12, fill: '#78716C' }));
  board.appendChild(btmPill);

  return board;
}
