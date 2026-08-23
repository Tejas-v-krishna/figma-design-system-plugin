// Per-component visual templates. Each template populates a ComponentNode
// passed in by the factory (which owns naming/organization).
import { ComponentDefinition, DesignTokens, GenerationConfig } from '../../../shared/types';
import { colorShade, radiusPx, shadow, ColorName } from '../tokenAccess';
import {
  makeFrame,
  setFill,
  setStroke,
  setEffect,
  text,
  rect,
  ellipse,
  line,
  hbox,
  vbox,
  pad,
} from '../primitives';
import { colorStyleKey, effectStyleKey, StyleMap } from '../styleKeys';
import { VariableMap } from '../variables';

export interface TemplateCtx {
  def: ComponentDefinition;
  tokens: DesignTokens;
  config: GenerationConfig;
  styleMap: StyleMap;
  varMap?: VariableMap;
  variantName: string;
  variantProps: Record<string, string | number | boolean>;
  stateName: string;
  stateProps: Record<string, string | number | boolean>;
  sizeName: string;
  sizeProps: Record<string, string | number | boolean>;
  showcaseType?: 'variant' | 'size' | 'state';
}

export type Template = (root: ComponentNode, ctx: TemplateCtx) => ComponentNode;

// ---------------- sample content ----------------
// Hoisted out of the templates that render them so each item is reached by
// iteration rather than by indexing a literal with a loop counter.

const SEGMENT_LABELS = ['Day', 'Week', 'Month'];

const AVATAR_MEMBERS: { initial: string; tone: ColorName }[] = [
  { initial: 'A', tone: 'primary' },
  { initial: 'B', tone: 'information' },
  { initial: 'C', tone: 'success' },
  { initial: 'D', tone: 'warning' },
];

/** "success" -> "Success". Safe on an empty string, where charAt returns "". */
function titleCase(word: string): string {
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

function specimenLabel(ctx: TemplateCtx, variantFallback: string): string {
  if (ctx.showcaseType === 'size') {
    const s = ctx.sizeName.toLowerCase();
    if (s === 'sm' || s === 'small') return `Small (${ctx.sizeProps.height ?? ctx.sizeProps.dimension ?? ctx.sizeProps.minHeight ?? 32}px)`;
    if (s === 'md' || s === 'medium') return `Medium (${ctx.sizeProps.height ?? ctx.sizeProps.dimension ?? ctx.sizeProps.minHeight ?? 40}px)`;
    if (s === 'lg' || s === 'large') return `Large (${ctx.sizeProps.height ?? ctx.sizeProps.dimension ?? ctx.sizeProps.minHeight ?? 48}px)`;
    if (s === 'xs') return `Extra Small (${ctx.sizeProps.height ?? 24}px)`;
    if (s === 'xl') return `Extra Large (${ctx.sizeProps.height ?? 56}px)`;
    return `${titleCase(ctx.sizeName)} Size`;
  }
  if (ctx.showcaseType === 'state') {
    const st = ctx.stateName.toLowerCase();
    if (st === 'default') return 'Default';
    if (st === 'hover') return 'Hover';
    if (st === 'focus') return 'Focus';
    if (st === 'active' || st === 'pressed') return 'Active / Pressed';
    if (st === 'error' || st === 'invalid') return 'Error / Invalid';
    if (st === 'disabled') return 'Disabled';
    if (st === 'readonly') return 'Read-Only';
    if (st === 'open') return 'Open Dropdown';
    if (st === 'checked') return 'Checked';
    if (st === 'unchecked') return 'Unchecked';
    if (st === 'indeterminate') return 'Indeterminate';
    if (st === 'drag-active' || st === 'dragactive') return 'Drag Active';
    if (st === 'uploading') return 'Uploading';
    if (st === 'complete') return 'Complete';
    if (st === 'loading') return 'Loading';
    return titleCase(ctx.stateName);
  }
  return variantFallback;
}

// ---------------- shared resolvers ----------------

function variantKey(ctx: TemplateCtx): string {
  return String(ctx.variantProps.variant ?? ctx.variantProps.type ?? ctx.variantName).toLowerCase();
}

function tone(ctx: TemplateCtx): ColorName {
  const v = variantKey(ctx);
  if (['danger', 'error'].includes(v)) return 'error';
  if (['success'].includes(v)) return 'success';
  if (['warning', 'warn'].includes(v)) return 'warning';
  if (['secondary', 'information', 'info'].includes(v)) return 'information';
  if (['ghost', 'outline', 'text', 'tertiary', 'default'].includes(v)) return 'neutral';
  return 'primary';
}

function sizeMetrics(ctx: TemplateCtx): { height: number; fontSize: number; padX: number } {
  const p = ctx.sizeProps;
  return {
    height: Number(p.height ?? p.dimension ?? 40),
    fontSize: Number(p.fontSize ?? 14),
    padX: Number(p.paddingX ?? 16),
  };
}

function disabledOpacity(ctx: TemplateCtx): number {
  return ctx.stateName.toLowerCase() === 'disabled' ? 0.45 : 1;
}

function containerRadius(ctx: TemplateCtx, step: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md', max = 16): number {
  if (ctx.config.radiusPreset === 'sharp') return 0;
  const raw = radiusPx(ctx.tokens, step);
  if (raw > 50) {
    return step === 'xs' || step === 'sm' ? 6 : step === 'md' ? 10 : 16;
  }
  return Math.min(max, raw);
}

function pillRadius(ctx: TemplateCtx, step: 'xs' | 'sm' | 'md' | 'lg' = 'md'): number {
  if (ctx.config.radiusPreset === 'sharp') return 0;
  if (ctx.config.radiusPreset === 'pill') return 9999;
  return radiusPx(ctx.tokens, step);
}

export const ICONS = {
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
  chevronUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22 6 12 13 2 6"></polyline></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
};

export type IconKind = keyof typeof ICONS;

export function buildIcon(size: number, hex: string, kind: IconKind = 'info'): FrameNode {
  const f = makeFrame('icon');
  f.resize(size, size);

  // Global, not the default first-match replace: `fill` and `stroke` both
  // carry currentColor in some of these glyphs, and a half-recoloured icon
  // renders one stroke in the requested colour and the rest in Figma's
  // default black.
  const svg = ICONS[kind].split('currentColor').join(hex);

  try {
    const node = figma.createNodeFromSvg(svg);
    node.name = kind;
    // rescale, not resize. The SVGs declare a 24x24 viewBox, so Figma hands
    // back a 24x24 frame; resizing that frame moves its edges without touching
    // the vectors inside, which then overflow or clip. rescale scales the
    // children and the stroke weights with it, which is what "a 16px icon"
    // means.
    const scale = size / Math.max(node.width, node.height, 1);
    // Figma rejects a scale at or below 0.01, and a no-op rescale is wasted work.
    if (scale > 0.01 && Math.abs(scale - 1) > 0.001) node.rescale(scale);
    f.appendChild(node);
  } catch (err) {
    // An icon is never worth failing a component over. Fall back to the plain
    // dot this function used to always draw, and say why on the console so a
    // malformed glyph in ICONS is findable rather than just visibly wrong.
    console.warn(`[design-system-kit] icon "${kind}" failed to render as SVG:`, err);
    f.appendChild(ellipse('icon-shape', size, hex));
  }
  return f;
}

function buildSpinner(size: number, hex: string): FrameNode {
  const f = makeFrame('spinner');
  f.resize(size, size);
  const e = ellipse('ring', size);
  e.fills = [];
  e.strokes = [{ type: 'SOLID', color: hexToRgbSafe(hex) }];
  e.strokeWeight = Math.max(2, size * 0.14);
  f.appendChild(e);
  return f;
}

function hexToRgbSafe(hex: string): RGB {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

// ---------------- templates ----------------

const Button: Template = (root, ctx) => {
  const t = tone(ctx);
  const m = sizeMetrics(ctx);
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isFocused = sKey === 'focused' || sKey === 'focus';
  const isGhost = vKey === 'ghost' || vKey === 'tertiary';
  const isOutline = vKey === 'outline' || vKey === 'secondary';
  const isBlack = vKey === 'black' || vKey === 'dark' || Boolean(ctx.variantProps.isBlack);
  const isInformation = vKey === 'information';
  const iconPos = String(ctx.variantProps.iconPosition || '');

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  pad(root, Math.max(6, Math.round((m.height - m.fontSize) / 2)), m.padX);
  const isPill = Boolean(ctx.variantProps.isPill) || ctx.config.radiusPreset === 'pill' || vKey === 'pill';
  root.cornerRadius = isPill ? 9999 : ctx.config.radiusPreset === 'sharp' ? 0 : radiusPx(ctx.tokens, 'md');

  if (isBlack) {
    if (isHover) {
      setFill(root, '#27272A');
    } else if (isActive) {
      setFill(root, '#09090B');
    } else if (sKey === 'disabled') {
      setFill(root, '#D4D4D8');
    } else {
      setFill(root, '#18181B');
    }
    if (isFocused) {
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.1, g: 0.1, b: 0.1, a: 0.25 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 2,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isGhost) {
    if (isHover) {
      setFill(root, colorShade(ctx.tokens, 'primary', 50), colorStyleKey('primary', 50), ctx.styleMap, ctx.varMap);
    } else if (isActive) {
      setFill(root, colorShade(ctx.tokens, 'primary', 100), colorStyleKey('primary', 100), ctx.styleMap, ctx.varMap);
    } else {
      root.fills = [];
    }
    if (isFocused) {
      setStroke(root, colorShade(ctx.tokens, 'primary', 500), 1.5);
    }
  } else if (isOutline) {
    if (isHover) {
      setFill(root, colorShade(ctx.tokens, 'neutral', 100), colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
    } else if (isActive) {
      setFill(root, colorShade(ctx.tokens, 'neutral', 200), colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    } else {
      setFill(root, '#FFFFFF');
    }
    setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1.5, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    if (isFocused) {
      setStroke(root, colorShade(ctx.tokens, 'primary', 500), 2);
    }
  } else if (isInformation) {
    const secShade = isHover ? 600 : isActive ? 700 : 500;
    setFill(root, colorShade(ctx.tokens, 'information', secShade), colorStyleKey('information', secShade), ctx.styleMap, ctx.varMap);
  } else {
    const baseShade = isHover ? 600 : isActive ? 700 : 500;
    if (sKey === 'disabled') {
      setFill(root, colorShade(ctx.tokens, 'primary', 200), colorStyleKey(t, 200), ctx.styleMap, ctx.varMap);
    } else {
      setFill(root, colorShade(ctx.tokens, t, baseShade), colorStyleKey(t, baseShade), ctx.styleMap, ctx.varMap);
    }
    if (isFocused) {
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.23, g: 0.51, b: 0.96, a: 0.35 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 3,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  }

  const textHex = isBlack
    ? '#FFFFFF'
    : isGhost
    ? colorShade(ctx.tokens, 'primary', 600)
    : isOutline
    ? colorShade(ctx.tokens, 'neutral', 900)
    : '#FFFFFF';

  root.opacity = disabledOpacity(ctx);

  const loading = sKey === 'loading';
  if (loading) {
    root.appendChild(buildSpinner(14, textHex));
  } else if (iconPos === 'left') {
    root.appendChild(buildIcon(14, textHex, 'plus'));
  }
  
  let btnLabel = 'Button';
  if (loading) {
    btnLabel = 'Loading…';
  } else if (ctx.showcaseType === 'size') {
    btnLabel = `Button (${m.height}px)`;
  } else if (ctx.variantProps.customLabel) {
    btnLabel = String(ctx.variantProps.customLabel);
  }

  const label = text({
    characters: btnLabel,
    fontFamily: ctx.config.fontFamily.body,
    weight: 600,
    fontSize: m.fontSize,
    fill: textHex,
  });
  root.appendChild(label);

  if (!loading && iconPos === 'right') {
    root.appendChild(buildIcon(14, textHex, 'download'));
  }

  return root;
};

const IconButton: Template = (root, ctx) => {
  const t = tone(ctx);
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isFocused = sKey === 'focused' || sKey === 'focus';
  const isBlack = vKey === 'black' || vKey === 'dark' || Boolean(ctx.variantProps.isBlack);
  const isGhost = vKey === 'ghost';
  const isOutline = vKey === 'outline' || vKey === 'tertiary';
  const baseShade = isHover ? 600 : isActive ? 700 : 500;

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 0);
  const iconBtnSize = ctx.sizeName === 'sm' ? 32 : 40;
  root.resize(iconBtnSize, iconBtnSize);
  root.cornerRadius = 9999;

  let fgHex = '#FFFFFF';

  if (isBlack) {
    if (isHover) setFill(root, '#27272A');
    else if (isActive) setFill(root, '#09090B');
    else if (sKey === 'disabled') setFill(root, '#D4D4D8');
    else setFill(root, '#18181B');
    fgHex = '#FFFFFF';
  } else if (isGhost) {
    if (isHover) setFill(root, colorShade(ctx.tokens, 'neutral', 100));
    else root.fills = [];
    fgHex = colorShade(ctx.tokens, 'neutral', 700);
  } else if (isOutline) {
    if (isHover) setFill(root, colorShade(ctx.tokens, 'neutral', 100));
    else setFill(root, '#FFFFFF');
    setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1.5);
    fgHex = colorShade(ctx.tokens, 'neutral', 700);
  } else {
    setFill(root, colorShade(ctx.tokens, t, baseShade));
    fgHex = '#FFFFFF';
  }

  if (isFocused) {
    root.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0.23, g: 0.51, b: 0.96, a: 0.35 },
      offset: { x: 0, y: 0 },
      radius: 4,
      spread: 3,
      visible: true,
      blendMode: 'NORMAL',
    }];
  }

  root.opacity = sKey === 'disabled' ? 0.6 : 1;
  root.appendChild(buildIcon(ctx.sizeName === 'sm' ? 14 : 16, fgHex, 'star'));

  return root;
};

const ButtonGroup: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 2;
  root.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : radiusPx(ctx.tokens, 'lg');
  pad(root, 3, 3);
  setFill(root, colorShade(ctx.tokens, 'neutral', 100), colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);

  for (const [i, label] of SEGMENT_LABELS.entries()) {
    const b = figma.createFrame();
    b.name = `item-${i}`;
    b.layoutMode = 'HORIZONTAL';
    b.primaryAxisSizingMode = 'AUTO';
    b.counterAxisSizingMode = 'AUTO';
    b.primaryAxisAlignItems = 'CENTER';
    b.counterAxisAlignItems = 'CENTER';
    pad(b, 6, 14);
    b.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : radiusPx(ctx.tokens, 'md');
    const selected = i === 1;
    if (selected) {
      setFill(b, '#FFFFFF');
      b.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      b.fills = [];
    }
    b.appendChild(text({
      characters: label,
      fontFamily: ctx.config.fontFamily.body,
      weight: selected ? 600 : 500,
      fontSize: 13,
      fill: selected ? colorShade(ctx.tokens, 'neutral', 900) : colorShade(ctx.tokens, 'neutral', 600),
    }));
    root.appendChild(b);
  }
  return root;
};

const Input: Template = (root, ctx) => {
  const isMatrix = Boolean(ctx.variantProps.isMatrix);
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const fieldHeight = Number(ctx.sizeProps.height ?? 40);
  const fieldWidth = Number(ctx.sizeProps.width ?? (isMatrix ? 128 : 260));
  const fontSize = Number(ctx.sizeProps.fontSize ?? (fieldHeight <= 32 ? 11 : fieldHeight >= 48 ? 15 : 13));
  const padX = isMatrix ? 8 : (fieldHeight <= 32 ? 10 : fieldHeight >= 48 ? 16 : 12);
  const iconSz = isMatrix ? 13 : (fieldHeight <= 32 ? 14 : fieldHeight >= 48 ? 18 : 16);
  const isPill = ctx.config.radiusPreset === 'pill';
  const isSharp = ctx.config.radiusPreset === 'sharp';

  root.layoutMode = isMatrix ? 'HORIZONTAL' : 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  root.fills = [];

  if (!isMatrix) {
    let fallbackLabel = 'First Name';
    if (vKey === 'email') fallbackLabel = 'Email Address';
    else if (vKey === 'password') fallbackLabel = 'Password';
    else if (vKey === 'search') fallbackLabel = 'Search';
    else if (vKey === 'number') fallbackLabel = 'Quantity';
    else if (vKey === 'url') fallbackLabel = 'Website URL';

    const labelText = specimenLabel(ctx, fallbackLabel);
    const lbl = text({
      characters: labelText,
      fontFamily: ctx.config.fontFamily.body,
      weight: 500,
      fontSize: 12,
      fill: colorShade(ctx.tokens, 'neutral', 700),
    });
    root.appendChild(lbl);
  }

  const control = makeFrame('control');
  control.layoutMode = 'HORIZONTAL';
  control.primaryAxisSizingMode = 'FIXED';
  control.counterAxisSizingMode = 'FIXED';
  control.primaryAxisAlignItems = 'MIN';
  control.counterAxisAlignItems = 'CENTER';
  control.itemSpacing = 6;
  pad(control, 0, padX);
  control.resize(fieldWidth, fieldHeight);
  control.cornerRadius = isPill ? 9999 : isSharp ? 0 : radiusPx(ctx.tokens, 'md');
  control.clipsContent = true;

  const isError = sKey === 'error' || sKey === 'invalid';
  const isFocus = sKey === 'focus' || sKey === 'focused';
  const isHover = sKey === 'hover';
  const isDisabled = sKey === 'disabled';
  const isReadOnly = sKey === 'readonly';

  if (isDisabled) {
    setFill(control, colorShade(ctx.tokens, 'neutral', 100));
    setStroke(control, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    root.opacity = 0.6;
  } else if (isReadOnly) {
    setFill(control, colorShade(ctx.tokens, 'neutral', 50));
    setStroke(control, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  } else {
    setFill(control, '#FFFFFF');
    if (isError) {
      setStroke(control, colorShade(ctx.tokens, 'error', 500), 1.5, colorStyleKey('error', 500), ctx.styleMap, ctx.varMap);
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.94, g: 0.27, b: 0.27, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocus) {
      setStroke(control, colorShade(ctx.tokens, 'primary', 500), 1.5, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
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
      setStroke(control, colorShade(ctx.tokens, 'neutral', 400), 1, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
    } else {
      setStroke(control, colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    }
  }

  const textFill = isDisabled ? colorShade(ctx.tokens, 'neutral', 400) : isReadOnly ? colorShade(ctx.tokens, 'neutral', 700) : colorShade(ctx.tokens, 'neutral', 900);
  const placeholderFill = colorShade(ctx.tokens, 'neutral', 400);

  if (ctx.showcaseType === 'size') {
    control.appendChild(text({ characters: `Sample (${fieldHeight}px)`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: placeholderFill }));
  } else if (vKey === 'email') {
    control.appendChild(buildIcon(iconSz, isError ? colorShade(ctx.tokens, 'error', 500) : colorShade(ctx.tokens, 'neutral', 400), 'mail'));
    control.appendChild(text({ characters: isMatrix ? 'alex@ex.com' : 'alex@example.com', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: textFill }));
  } else if (vKey === 'password') {
    control.appendChild(buildIcon(iconSz, isError ? colorShade(ctx.tokens, 'error', 500) : colorShade(ctx.tokens, 'neutral', 400), 'lock'));
    const val = text({ characters: '••••••••', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: textFill });
    control.appendChild(val);
    val.layoutSizingHorizontal = 'FILL';
    control.appendChild(buildIcon(iconSz, colorShade(ctx.tokens, 'neutral', 400), 'eye'));
  } else if (vKey === 'search') {
    control.appendChild(buildIcon(iconSz, colorShade(ctx.tokens, 'neutral', 400), 'search'));
    control.appendChild(text({ characters: isMatrix ? 'Search…' : 'Search components…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: placeholderFill }));
  } else if (vKey === 'number') {
    const val = text({ characters: '42', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize, fill: textFill });
    control.appendChild(val);
    val.layoutSizingHorizontal = 'FILL';
    const stepper = hbox('stepper');
    stepper.itemSpacing = 2;
    stepper.appendChild(buildIcon(11, colorShade(ctx.tokens, 'neutral', 500), 'minus'));
    stepper.appendChild(buildIcon(11, colorShade(ctx.tokens, 'neutral', 500), 'plus'));
    control.appendChild(stepper);
  } else if (vKey === 'url') {
    const prefix = text({ characters: 'https://', fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: Math.max(10, fontSize - 2), fill: colorShade(ctx.tokens, 'neutral', 400) });
    control.appendChild(prefix);
    control.appendChild(text({ characters: 'acme.com', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: textFill }));
  } else {
    let placeholderStr = 'Enter text…';
    let isValue = false;
    if (isFocus) {
      placeholderStr = 'typing…|';
      isValue = true;
    } else if (sKey === 'readonly') {
      placeholderStr = 'API_KEY';
      isValue = true;
    } else if (isError) {
      placeholderStr = 'invalid-input';
      isValue = true;
    }
    control.appendChild(text({ characters: placeholderStr, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: isValue ? textFill : placeholderFill }));
  }

  root.appendChild(control);

  if (!isMatrix && isError) {
    const errRow = hbox('err');
    errRow.itemSpacing = 4;
    errRow.counterAxisAlignItems = 'CENTER';
    errRow.appendChild(buildIcon(12, colorShade(ctx.tokens, 'error', 500), 'warning'));
    errRow.appendChild(text({ characters: 'This field is required', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'error', 600) }));
    root.appendChild(errRow);
  }
  return root;
};

const Textarea: Template = (root, ctx) => {
  const isMatrix = Boolean(ctx.variantProps.isMatrix);
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const minH = Number(ctx.sizeProps.height ?? (isMatrix ? 58 : 96));
  const fieldWidth = Number(ctx.sizeProps.width ?? (isMatrix ? 128 : 260));
  const fontSize = Number(ctx.sizeProps.fontSize ?? (minH <= 64 ? 11 : minH >= 128 ? 15 : 13));

  root.layoutMode = isMatrix ? 'HORIZONTAL' : 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  root.fills = [];

  if (!isMatrix) {
    let fallbackLabel = 'Description';
    if (vKey === 'auto-resize' || vKey === 'autoresize') fallbackLabel = 'Auto-Resize Feedback';

    const labelText = specimenLabel(ctx, fallbackLabel);
    const lbl = text({
      characters: labelText,
      fontFamily: ctx.config.fontFamily.body,
      weight: 500,
      fontSize: 12,
      fill: colorShade(ctx.tokens, 'neutral', 700),
    });
    root.appendChild(lbl);
  }

  const control = makeFrame('control');
  control.layoutMode = 'VERTICAL';
  control.primaryAxisSizingMode = 'FIXED';
  control.counterAxisSizingMode = 'FIXED';
  control.primaryAxisAlignItems = 'MIN';
  control.counterAxisAlignItems = 'MIN';
  pad(control, 8, 10);
  control.cornerRadius = containerRadius(ctx, 'md', 8);
  control.resize(fieldWidth, minH);
  control.clipsContent = true;

  const isError = sKey === 'error';
  const isFocus = sKey === 'focus' || sKey === 'focused';
  const isHover = sKey === 'hover';
  const isDisabled = sKey === 'disabled';

  if (isDisabled) {
    setFill(control, colorShade(ctx.tokens, 'neutral', 100));
    setStroke(control, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    root.opacity = 0.6;
  } else {
    setFill(control, '#FFFFFF');
    if (isError) {
      setStroke(control, colorShade(ctx.tokens, 'error', 500), 1.5, colorStyleKey('error', 500), ctx.styleMap, ctx.varMap);
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.94, g: 0.27, b: 0.27, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocus) {
      setStroke(control, colorShade(ctx.tokens, 'primary', 500), 1.5, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
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
      setStroke(control, colorShade(ctx.tokens, 'neutral', 400), 1, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
    } else {
      setStroke(control, colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    }
  }

  let taMsg = isMatrix ? 'Enter text…' : 'Enter your description or message…';
  let isVal = false;
  if (ctx.showcaseType === 'size') {
    taMsg = `Textarea (${minH}px)`;
  } else if (isFocus) {
    taMsg = isMatrix ? 'Typing feedback…|' : 'Here is my thoughtful feedback so far…|';
    isVal = true;
  } else if (isError) {
    taMsg = isMatrix ? 'Exceeded limit…' : 'Exceeded the maximum allowed 500 characters in this form field…';
    isVal = true;
  }

  const ta = text({
    characters: taMsg,
    fontFamily: ctx.config.fontFamily.body,
    weight: 400,
    fontSize,
    fill: isVal ? (isError ? colorShade(ctx.tokens, 'error', 600) : colorShade(ctx.tokens, 'neutral', 900)) : colorShade(ctx.tokens, 'neutral', 400),
  });
  ta.textAutoResize = 'HEIGHT';
  control.appendChild(ta);

  if (vKey === 'auto-resize' || vKey === 'autoresize') {
    const handle = hbox('gripper');
    handle.primaryAxisAlignItems = 'MAX';
    handle.resize(fieldWidth - 20, 12);
    handle.appendChild(text({ characters: '◿', fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 400) }));
    control.appendChild(handle);
  }

  root.appendChild(control);

  if (!isMatrix && isError) {
    const errRow = hbox('err');
    errRow.itemSpacing = 4;
    errRow.counterAxisAlignItems = 'CENTER';
    errRow.appendChild(buildIcon(12, colorShade(ctx.tokens, 'error', 500), 'warning'));
    errRow.appendChild(text({ characters: 'Character limit exceeded (500 max)', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'error', 600) }));
    root.appendChild(errRow);
  }
  return root;
};

const Select: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const fieldHeight = Number(ctx.sizeProps.height ?? 40);
  const fontSize = Number(ctx.sizeProps.fontSize ?? (fieldHeight <= 32 ? 12 : fieldHeight >= 48 ? 15 : 14));
  const padX = fieldHeight <= 32 ? 10 : fieldHeight >= 48 ? 16 : 12;
  const isPill = ctx.config.radiusPreset === 'pill';
  const isSharp = ctx.config.radiusPreset === 'sharp';

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  let fallbackLabel = 'Country / Region';
  if (vKey === 'withsearch' || vKey === 'with-search') fallbackLabel = 'Searchable Select';
  else if (vKey === 'multiselect' || vKey === 'multi-select') fallbackLabel = 'Multi-Select Tags';
  else if (vKey === 'withgroups' || vKey === 'with-groups') fallbackLabel = 'Grouped Category';

  const labelText = specimenLabel(ctx, fallbackLabel);
  const lbl = text({
    characters: labelText,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: 12,
    fill: colorShade(ctx.tokens, 'neutral', 700),
  });
  root.appendChild(lbl);

  const control = makeFrame('control');
  control.layoutMode = 'HORIZONTAL';
  control.primaryAxisSizingMode = 'FIXED';
  control.counterAxisSizingMode = 'FIXED';
  control.primaryAxisAlignItems = 'SPACE_BETWEEN';
  control.counterAxisAlignItems = 'CENTER';
  control.itemSpacing = 8;
  pad(control, 0, padX);
  control.resize(260, fieldHeight);
  control.cornerRadius = isPill ? 9999 : isSharp ? 0 : radiusPx(ctx.tokens, 'md');
  control.clipsContent = true;

  const isError = sKey === 'error';
  const isFocus = sKey === 'focus';
  const isOpen = sKey === 'open';
  const isHover = sKey === 'hover';
  const isDisabled = sKey === 'disabled';

  if (isDisabled) {
    setFill(control, colorShade(ctx.tokens, 'neutral', 50));
    setStroke(control, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    root.opacity = 0.6;
  } else {
    setFill(control, '#FFFFFF');
    if (isError) {
      setStroke(control, colorShade(ctx.tokens, 'error', 500), 1.5, colorStyleKey('error', 500), ctx.styleMap, ctx.varMap);
      control.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.94, g: 0.27, b: 0.27, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocus || isOpen) {
      setStroke(control, colorShade(ctx.tokens, 'primary', 500), 1.5, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
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
      setStroke(control, colorShade(ctx.tokens, 'neutral', 400), 1, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
    } else {
      setStroke(control, colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    }
  }

  const leftBox = makeFrame('left');
  leftBox.layoutMode = 'HORIZONTAL';
  leftBox.primaryAxisSizingMode = 'AUTO';
  leftBox.counterAxisSizingMode = 'AUTO';
  leftBox.primaryAxisAlignItems = 'MIN';
  leftBox.counterAxisAlignItems = 'CENTER';
  leftBox.itemSpacing = 6;
  leftBox.fills = [];

  if (vKey === 'withsearch' || vKey === 'with-search') {
    leftBox.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 400), 'search'));
    leftBox.appendChild(text({ characters: 'Search options…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  } else if (vKey === 'multiselect' || vKey === 'multi-select') {
    const tag1 = makeFrame('tag1');
    tag1.layoutMode = 'HORIZONTAL';
    tag1.primaryAxisSizingMode = 'AUTO';
    tag1.counterAxisSizingMode = 'AUTO';
    tag1.primaryAxisAlignItems = 'CENTER';
    tag1.counterAxisAlignItems = 'CENTER';
    tag1.paddingTop = 2; tag1.paddingBottom = 2; tag1.paddingLeft = 6; tag1.paddingRight = 6;
    tag1.cornerRadius = 4;
    setFill(tag1, colorShade(ctx.tokens, 'primary', 50));
    setStroke(tag1, colorShade(ctx.tokens, 'primary', 200), 1);
    tag1.appendChild(text({ characters: 'Design ✕', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 700) }));
    leftBox.appendChild(tag1);

    const tag2 = makeFrame('tag2');
    tag2.layoutMode = 'HORIZONTAL';
    tag2.primaryAxisSizingMode = 'AUTO';
    tag2.counterAxisSizingMode = 'AUTO';
    tag2.primaryAxisAlignItems = 'CENTER';
    tag2.counterAxisAlignItems = 'CENTER';
    tag2.paddingTop = 2; tag2.paddingBottom = 2; tag2.paddingLeft = 6; tag2.paddingRight = 6;
    tag2.cornerRadius = 4;
    setFill(tag2, colorShade(ctx.tokens, 'neutral', 100));
    tag2.appendChild(text({ characters: '+2 more', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 600) }));
    leftBox.appendChild(tag2);
  } else if (vKey === 'withgroups' || vKey === 'with-groups') {
    const grp = text({ characters: 'Product /', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: Math.max(11, fontSize - 2), fill: colorShade(ctx.tokens, 'primary', 600) });
    leftBox.appendChild(grp);
    leftBox.appendChild(text({ characters: 'Roadmap', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  } else {
    let valText = 'Select an option…';
    let isVal = false;
    if (ctx.showcaseType === 'size') {
      valText = `Select (${fieldHeight}px)`;
    } else if (isOpen) {
      valText = 'United States';
      isVal = true;
    }
    leftBox.appendChild(text({ characters: valText, fontFamily: ctx.config.fontFamily.body, weight: isVal ? 500 : 400, fontSize, fill: isVal ? colorShade(ctx.tokens, 'neutral', 900) : colorShade(ctx.tokens, 'neutral', 400) }));
  }

  control.appendChild(leftBox);
  control.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 500), isOpen ? 'chevronUp' : 'chevronDown'));
  root.appendChild(control);

  if (isError) {
    const errRow = hbox('err');
    errRow.itemSpacing = 4;
    errRow.counterAxisAlignItems = 'CENTER';
    errRow.appendChild(buildIcon(12, colorShade(ctx.tokens, 'error', 500), 'warning'));
    errRow.appendChild(text({ characters: 'Selection is required', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'error', 600) }));
    root.appendChild(errRow);
  }
  return root;
};

const Checkbox: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const d = Number(ctx.sizeProps.dimension ?? 20);
  const fontSize = d <= 16 ? 12 : d >= 24 ? 16 : 14;

  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.fills = [];

  const isChecked = sKey === 'checked' || (!['unchecked', 'indeterminate', 'default'].includes(sKey) && !vKey.includes('indeterminate'));
  const isIndeterminate = vKey === 'indeterminate' || sKey === 'indeterminate';
  const isDisabled = sKey === 'disabled';

  const box = makeFrame('box');
  box.layoutMode = 'HORIZONTAL';
  box.primaryAxisAlignItems = 'CENTER';
  box.counterAxisAlignItems = 'CENTER';
  box.resize(d, d);
  box.cornerRadius = containerRadius(ctx, 'sm', 4);

  if (isDisabled) {
    setFill(box, colorShade(ctx.tokens, 'neutral', 100));
    setStroke(box, colorShade(ctx.tokens, 'neutral', 300), 1.5, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    root.opacity = 0.5;
  } else if (isChecked || isIndeterminate) {
    setFill(box, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
    box.appendChild(buildIcon(Math.round(d * 0.7), '#FFFFFF', isIndeterminate ? 'minus' : 'check'));
  } else {
    setFill(box, '#FFFFFF');
    setStroke(box, colorShade(ctx.tokens, 'neutral', 400), 1.5, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
  }

  root.appendChild(box);

  let fallbackLabel = 'Remember this setting';
  if (isIndeterminate) fallbackLabel = 'Select all (partial)';

  const labelStr = specimenLabel(ctx, fallbackLabel);
  root.appendChild(text({ characters: labelStr, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  return root;
};

const Radio: Template = (root, ctx) => {
  const sKey = ctx.stateName.toLowerCase();
  const d = Number(ctx.sizeProps.dimension ?? 20);
  const fontSize = d <= 16 ? 12 : d >= 24 ? 16 : 14;

  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.fills = [];

  const isChecked = sKey === 'checked';
  const isDisabled = sKey === 'disabled';

  const ring = makeFrame('ring');
  ring.layoutMode = 'HORIZONTAL';
  ring.primaryAxisAlignItems = 'CENTER';
  ring.counterAxisAlignItems = 'CENTER';
  ring.resize(d, d);

  const ringShape = ellipse('ring-shape', d, '#FFFFFF');
  if (isDisabled) {
    setStroke(ringShape, colorShade(ctx.tokens, 'neutral', 300), 1.5, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    root.opacity = 0.5;
  } else if (isChecked) {
    setStroke(ringShape, colorShade(ctx.tokens, 'primary', 500), 2, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  } else {
    setStroke(ringShape, colorShade(ctx.tokens, 'neutral', 400), 1.5, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
  }
  ring.appendChild(ringShape);
  ringShape.layoutPositioning = 'ABSOLUTE';

  if (isChecked) {
    const dot = ellipse('dot', Math.round(d * 0.5), colorShade(ctx.tokens, 'primary', 500));
    ring.appendChild(dot);
    dot.layoutPositioning = 'ABSOLUTE';
    dot.x = Math.round(d * 0.25);
    dot.y = Math.round(d * 0.25);
  }

  root.appendChild(ring);
  const radioLabel = specimenLabel(ctx, isChecked ? 'Selected plan' : 'Standard plan');
  root.appendChild(text({ characters: radioLabel, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  return root;
};

const Switch: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const w = Number(ctx.sizeProps.width ?? 44);
  const h = Number(ctx.sizeProps.height ?? 24);
  const knobSz = h - 6;

  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.fills = [];

  const on = ['on', 'active', 'true'].includes(sKey) || (!['off', 'default', 'disabled'].includes(sKey) && sKey !== 'off');
  const isDisabled = sKey === 'disabled';

  const track = makeFrame('track');
  track.layoutMode = 'HORIZONTAL';
  track.counterAxisAlignItems = 'CENTER';
  track.resize(w, h);
  track.cornerRadius = 9999;

  if (isDisabled) {
    setFill(track, colorShade(ctx.tokens, 'neutral', 200));
    root.opacity = 0.5;
  } else if (on) {
    setFill(track, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  } else {
    setFill(track, colorShade(ctx.tokens, 'neutral', 300), colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
  }

  const knob = ellipse('knob', knobSz, '#FFFFFF');
  knob.x = on ? (w - knobSz - 3) : 3;
  knob.y = 3;
  knob.layoutPositioning = 'ABSOLUTE';
  track.appendChild(knob);
  root.appendChild(track);

  let labelStr = '';
  if (ctx.showcaseType === 'size') {
    labelStr = specimenLabel(ctx, 'Switch');
  } else if (ctx.showcaseType === 'state') {
    labelStr = specimenLabel(ctx, on ? 'On' : 'Off');
  } else if (vKey === 'withlabel' || vKey === 'with-label') {
    labelStr = on ? 'Notifications enabled' : 'Notifications muted';
  }

  if (labelStr) {
    root.appendChild(text({ characters: labelStr, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  }
  return root;
};

const Slider: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  const isRange = vKey === 'range';
  const withLabels = vKey === 'withlabels' || vKey === 'with-labels';
  const isDisabled = sKey === 'disabled';

  if (withLabels) {
    const topLabels = hbox('topLabels');
    topLabels.primaryAxisAlignItems = 'SPACE_BETWEEN';
    topLabels.resize(220, 16);
    topLabels.appendChild(text({ characters: 'Min ($0)', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
    topLabels.appendChild(text({ characters: '$120 / mo', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 700) }));
    topLabels.appendChild(text({ characters: 'Max ($200)', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
    root.appendChild(topLabels);
  }

  const bar = makeFrame('bar');
  bar.layoutMode = 'HORIZONTAL';
  bar.counterAxisAlignItems = 'CENTER';
  bar.resize(220, 24);

  const track = makeFrame('track');
  track.resize(220, 6);
  track.cornerRadius = 9999;
  setFill(track, colorShade(ctx.tokens, 'neutral', 200));

  if (isRange) {
    const fill = rect('fill', 100, 6, colorShade(ctx.tokens, 'primary', 500));
    fill.cornerRadius = 9999;
    fill.x = 40;
    fill.layoutPositioning = 'ABSOLUTE';
    track.appendChild(fill);
    bar.appendChild(track);

    const knob1 = ellipse('knob-min', 18, '#FFFFFF');
    setStroke(knob1, colorShade(ctx.tokens, 'primary', 500), 2);
    knob1.x = 32; knob1.y = 3; knob1.layoutPositioning = 'ABSOLUTE';
    bar.appendChild(knob1);

    const knob2 = ellipse('knob-max', 18, '#FFFFFF');
    setStroke(knob2, colorShade(ctx.tokens, 'primary', 500), 2);
    knob2.x = 132; knob2.y = 3; knob2.layoutPositioning = 'ABSOLUTE';
    bar.appendChild(knob2);
  } else {
    const fill = rect('fill', 130, 6, colorShade(ctx.tokens, 'primary', 500));
    fill.cornerRadius = 9999;
    track.appendChild(fill);
    bar.appendChild(track);

    const knob = ellipse('knob', 18, '#FFFFFF');
    setStroke(knob, colorShade(ctx.tokens, 'primary', 500), 2);
    knob.x = 121; knob.y = 3; knob.layoutPositioning = 'ABSOLUTE';
    bar.appendChild(knob);
  }

  if (isDisabled) root.opacity = 0.5;
  root.appendChild(bar);
  return root;
};

const Card: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 14;
  pad(root, 20);
  root.cornerRadius = containerRadius(ctx, 'lg', 16);
  root.resize(280, 190);

  const isOutlined = vKey === 'outlined';
  const isFilled = vKey === 'filled';
  const isInteractive = vKey === 'interactive';
  const isHover = sKey === 'hover';
  const isDisabled = sKey === 'disabled';

  if (isFilled) {
    setFill(root, colorShade(ctx.tokens, 'neutral', 50));
    setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  } else if (isInteractive) {
    setFill(root, isHover ? colorShade(ctx.tokens, 'primary', 50) : '#FFFFFF');
    setStroke(root, isHover ? colorShade(ctx.tokens, 'primary', 400) : colorShade(ctx.tokens, 'neutral', 200), 1);
    setEffect(root, shadow(ctx.tokens, isHover ? 'lg' : 'sm'), effectStyleKey(isHover ? 'lg' : 'sm'), ctx.styleMap, ctx.varMap);
  } else if (isOutlined) {
    setFill(root, '#FFFFFF');
    setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
  } else {
    setFill(root, '#FFFFFF');
    setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    setEffect(root, shadow(ctx.tokens, isHover ? 'lg' : 'md'), effectStyleKey(isHover ? 'lg' : 'md'), ctx.styleMap, ctx.varMap);
  }

  if (isDisabled) root.opacity = 0.5;

  const topRow = hbox('topRow');
  topRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  topRow.counterAxisAlignItems = 'CENTER';
  topRow.resize(240, 28);

  const iconBadge = makeFrame('iconBadge');
  pad(iconBadge, 6);
  iconBadge.cornerRadius = 8;
  setFill(iconBadge, colorShade(ctx.tokens, 'primary', 100));
  iconBadge.appendChild(buildIcon(16, colorShade(ctx.tokens, 'primary', 600), 'star'));
  topRow.appendChild(iconBadge);

  const tagBadge = makeFrame('tagBadge');
  pad(tagBadge, 3, 8);
  tagBadge.cornerRadius = 6;
  setFill(tagBadge, colorShade(ctx.tokens, 'success', 50));
  setStroke(tagBadge, colorShade(ctx.tokens, 'success', 200), 1);
  tagBadge.appendChild(text({ characters: '+24.5%', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'success', 700) }));
  topRow.appendChild(tagBadge);
  root.appendChild(topRow);

  let titleStr = 'Real-time Analytics';
  if (vKey === 'interactive') titleStr = 'Interactive Card';
  else if (vKey === 'outlined') titleStr = 'Outlined Card';
  else if (vKey === 'filled') titleStr = 'Filled Card';

  const cardTitle = specimenLabel(ctx, titleStr);
  const textCol = vbox('textCol');
  textCol.itemSpacing = 4;
  textCol.appendChild(text({ characters: cardTitle, fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 15, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  textCol.appendChild(text({ characters: 'Track active engagement and conversions with instant metric reports.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  root.appendChild(textCol);

  const footerLink = text({ characters: 'View details →', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'primary', 600) });
  root.appendChild(footerLink);

  return root;
};

const CardHeader: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 4;
  pad(root, 16);
  root.appendChild(text({ characters: 'Card Title', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Supporting subtitle text for context', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const CardContent: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 16);
  root.appendChild(text({ characters: 'Card body content describing primary details and features.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  return root;
};

const CardFooter: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 14, 16);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.appendChild(text({ characters: 'Cancel', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  const ok = makeFrame('ok');
  pad(ok, 6, 14);
  ok.cornerRadius = 6;
  setFill(ok, colorShade(ctx.tokens, 'primary', 500));
  ok.appendChild(text({ characters: 'Save Changes', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  root.appendChild(ok);
  return root;
};

function populateAlert(root: ComponentNode, ctx: TemplateCtx, toneName: ColorName): void {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 12;
  pad(root, 14, 16);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, colorShade(ctx.tokens, toneName, 50), colorStyleKey(toneName, 50), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, toneName, 300), 1, colorStyleKey(toneName, 300), ctx.styleMap, ctx.varMap);
  root.resize(360, 64);
  let iconType: IconKind = 'info';
  if (toneName === 'error' || toneName === 'warning') iconType = 'warning';
  if (toneName === 'success') iconType = 'check';
  root.appendChild(buildIcon(20, colorShade(ctx.tokens, toneName, 500), iconType));
  const tf = vbox('text');
  tf.itemSpacing = 2;
  const alertTitle = specimenLabel(ctx, `${titleCase(toneName)} Notification`);
  tf.appendChild(text({ characters: alertTitle, fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, toneName, 900) }));
  tf.appendChild(text({ characters: `This is an important ${toneName} message for your workflow.`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, toneName, 700) }));
  root.appendChild(tf);
}

const Alert: Template = (root, ctx) => {
  populateAlert(root, ctx, tone(ctx));
  return root;
};

const Toast: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 12;
  pad(root, 12, 16);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, '#0F172A');
  setEffect(root, shadow(ctx.tokens, 'lg'), effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  root.resize(340, 56);

  const left = hbox('left');
  left.itemSpacing = 10;
  left.counterAxisAlignItems = 'CENTER';
  let iconType: IconKind = 'info';
  if (t === 'error' || t === 'warning') iconType = 'warning';
  if (t === 'success') iconType = 'check';
  left.appendChild(buildIcon(18, colorShade(ctx.tokens, t, 400), iconType));
  left.appendChild(text({ characters: 'Changes saved successfully', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: '#F8FAFC' }));
  root.appendChild(left);

  root.appendChild(text({ characters: 'Undo', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: '#60A5FA' }));
  return root;
};

const Badge: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 5;
  pad(root, 3, 8);
  root.cornerRadius = pillRadius(ctx, 'sm');
  setFill(root, colorShade(ctx.tokens, t, 100), colorStyleKey(t, 100), ctx.styleMap, ctx.varMap);
  const dot = ellipse('dot', 5, colorShade(ctx.tokens, t, 600));
  root.appendChild(dot);
  const badgeLabel = specimenLabel(ctx, titleCase(t));
  root.appendChild(text({ characters: badgeLabel, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, t, 800) }));
  return root;
};

const Tag: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  pad(root, 4, 10);
  root.cornerRadius = pillRadius(ctx, 'sm');
  setFill(root, colorShade(ctx.tokens, t, 100), colorStyleKey(t, 100), ctx.styleMap, ctx.varMap);
  const tagLabel = specimenLabel(ctx, titleCase(t));
  root.appendChild(text({ characters: tagLabel, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, t, 800) }));
  if (variantKey(ctx).includes('removable')) {
    root.appendChild(buildIcon(12, colorShade(ctx.tokens, t, 600), 'close'));
  }
  return root;
};

const Avatar: Template = (root, ctx) => {
  const d = Number(ctx.sizeProps.dimension ?? 40);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(d, d);
  root.cornerRadius = Number(ctx.variantProps.variant) === 0 || ctx.variantProps.variant === 'square' ? containerRadius(ctx, 'md', 8) : 9999;
  setFill(root, colorShade(ctx.tokens, 'primary', 100), colorStyleKey('primary', 100), ctx.styleMap, ctx.varMap);
  const ini = text({ characters: 'AB', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: d * 0.4, fill: colorShade(ctx.tokens, 'primary', 700), align: 'CENTER' });
  ini.textAlignHorizontal = 'CENTER';
  ini.layoutAlign = 'CENTER';
  root.appendChild(ini);
  return root;
};

const AvatarStack: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = -8;
  for (const [i, member] of AVATAR_MEMBERS.entries()) {
    const a = makeFrame(`a-${i}`);
    a.layoutMode = 'HORIZONTAL';
    a.primaryAxisAlignItems = 'CENTER';
    a.counterAxisAlignItems = 'CENTER';
    a.resize(36, 36);
    const shape = ellipse('shape', 36, colorShade(ctx.tokens, member.tone, 400));
    setStroke(shape, '#FFFFFF', 2);
    a.appendChild(shape);
    shape.layoutPositioning = 'ABSOLUTE';
    a.appendChild(text({ characters: member.initial, fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: '#FFFFFF', align: 'CENTER' }));
    root.appendChild(a);
  }
  return root;
};

const Progress: Template = (root, ctx) => {
  const kind = variantKey(ctx);
  if (kind === 'circular') {
    const e = ellipse('ring', 64);
    e.fills = [];
    e.strokes = [{ type: 'SOLID', color: hexToRgbSafe(colorShade(ctx.tokens, 'neutral', 200)) }];
    e.strokeWeight = 8;
    const e2 = ellipse('value', 64);
    e2.fills = [];
    e2.strokes = [{ type: 'SOLID', color: hexToRgbSafe(colorShade(ctx.tokens, 'primary', 500)) }];
    e2.strokeWeight = 8;
    root.appendChild(e);
    root.appendChild(e2);
    root.appendChild(text({ characters: '70%', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 700), align: 'CENTER' }));
    return root;
  }
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 6;
  root.resize(220, 26);

  const topRow = hbox('topRow');
  topRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  topRow.resize(220, 14);
  topRow.appendChild(text({ characters: 'Progress', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  topRow.appendChild(text({ characters: '70%', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 600) }));
  root.appendChild(topRow);

  const track = makeFrame('track');
  track.resize(220, 6);
  track.cornerRadius = 9999;
  setFill(track, colorShade(ctx.tokens, 'neutral', 200));
  const fill = rect('fill', 154, 6, colorShade(ctx.tokens, 'primary', 500));
  fill.cornerRadius = 9999;
  track.appendChild(fill);
  root.appendChild(track);
  return root;
};

const Spinner: Template = (root, ctx) => {
  const e = ellipse('ring', 32);
  e.fills = [];
  e.strokes = [{ type: 'SOLID', color: hexToRgbSafe(colorShade(ctx.tokens, 'primary', 500)) }];
  e.strokeWeight = 4;
  root.appendChild(e);
  return root;
};

const Skeleton: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 10;
  pad(root, 12);
  root.cornerRadius = 10;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.resize(220, 96);

  const topRow = hbox('topRow');
  topRow.itemSpacing = 10;
  topRow.counterAxisAlignItems = 'CENTER';
  const c = ellipse('c', 28, colorShade(ctx.tokens, 'neutral', 200));
  topRow.appendChild(c);
  const headLine = rect('headLine', 120, 12, colorShade(ctx.tokens, 'neutral', 200));
  headLine.cornerRadius = 4;
  topRow.appendChild(headLine);
  root.appendChild(topRow);

  const line1 = rect('line1', 190, 10, colorShade(ctx.tokens, 'neutral', 100));
  line1.cornerRadius = 4;
  root.appendChild(line1);

  const line2 = rect('line2', 140, 10, colorShade(ctx.tokens, 'neutral', 100));
  line2.cornerRadius = 4;
  root.appendChild(line2);

  return root;
};

const EmptyState: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 10;
  pad(root, 24);
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.cornerRadius = containerRadius(ctx, 'lg', 14);
  root.resize(280, 180);

  const icCircle = makeFrame('icCircle');
  icCircle.resize(40, 40);
  icCircle.cornerRadius = 9999;
  setFill(icCircle, colorShade(ctx.tokens, 'primary', 50));
  icCircle.primaryAxisAlignItems = 'CENTER';
  icCircle.counterAxisAlignItems = 'CENTER';
  icCircle.appendChild(buildIcon(20, colorShade(ctx.tokens, 'primary', 500), 'search'));
  root.appendChild(icCircle);

  root.appendChild(text({ characters: 'No items found', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Create a new item to get started.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500), align: 'CENTER' }));

  const btn = makeFrame('btn');
  pad(btn, 6, 12);
  btn.cornerRadius = 6;
  setFill(btn, colorShade(ctx.tokens, 'primary', 500));
  btn.appendChild(text({ characters: '+ New Item', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
  root.appendChild(btn);

  return root;
};

const Tabs: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const isUnderline = vKey === 'underline' || vKey === 'line';

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = isUnderline ? 16 : 4;
  pad(root, isUnderline ? 0 : 4);
  if (!isUnderline) {
    setFill(root, colorShade(ctx.tokens, 'neutral', 100));
    root.cornerRadius = containerRadius(ctx, 'md', 10);
  } else {
    root.fills = [];
  }

  ['Overview', 'Integrations', 'Billing'].forEach((label, i) => {
    const tab = makeFrame(`tab-${i}`);
    tab.layoutMode = 'VERTICAL';
    tab.primaryAxisAlignItems = 'CENTER';
    tab.counterAxisAlignItems = 'CENTER';
    const active = i === 0;

    if (isUnderline) {
      pad(tab, 8, 4);
      tab.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 600) }));
      if (active) {
        const bar = rect('indicator', 60, 2, colorShade(ctx.tokens, 'primary', 500));
        tab.appendChild(bar);
      }
    } else {
      pad(tab, 8, 14);
      tab.cornerRadius = containerRadius(ctx, 'sm', 6);
      setFill(tab, active ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 100), active ? undefined : colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
      if (active) setEffect(tab, shadow(ctx.tokens, 'xs'), effectStyleKey('xs'), ctx.styleMap, ctx.varMap);
      tab.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? colorShade(ctx.tokens, 'primary', 700) : colorShade(ctx.tokens, 'neutral', 600) }));
    }
    root.appendChild(tab);
  });
  return root;
};

const Breadcrumb: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  ['Home', 'Library', 'Current'].forEach((label, i, arr) => {
    root.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: i === arr.length - 1 ? 600 : 400, fontSize: 13, fill: i === arr.length - 1 ? colorShade(ctx.tokens, 'neutral', 900) : colorShade(ctx.tokens, 'neutral', 500) }));
    if (i < arr.length - 1) root.appendChild(text({ characters: '/', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  });
  return root;
};

const Pagination: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 4;
  ['‹', '1', '2', '3', '…', '›'].forEach((label, i) => {
    const active = label === '2';
    const cell = makeFrame(`cell-${i}`);
    cell.layoutMode = 'HORIZONTAL';
    cell.primaryAxisAlignItems = 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';
    cell.resize(36, 36);
    cell.cornerRadius = containerRadius(ctx, 'md', 8);
    if (active) setFill(cell, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
    cell.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 700) }));
    root.appendChild(cell);
  });
  return root;
};

const Stepper: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  [0, 1, 2].forEach((i) => {
    const dot = makeFrame(`step-${i}`);
    dot.layoutMode = 'HORIZONTAL';
    dot.primaryAxisAlignItems = 'CENTER';
    dot.counterAxisAlignItems = 'CENTER';
    dot.resize(28, 28);
    const circle = ellipse('shape', 28, i <= 1 ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 200));
    dot.appendChild(circle);
    circle.layoutPositioning = 'ABSOLUTE';
    dot.appendChild(text({ characters: String(i + 1), fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: i <= 1 ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 500), align: 'CENTER' }));
    root.appendChild(dot);
    if (i < 2) {
      const conn = rect(`conn-${i}`, 40, 2, i === 0 ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 200));
      root.appendChild(conn);
    }
  });
  return root;
};

function populateTable(root: ComponentNode, ctx: TemplateCtx): void {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = containerRadius(ctx, 'lg', 14);
  setFill(root, '#FFFFFF');
  root.clipsContent = true;

  const header = makeFrame('row-header');
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  pad(header, 10, 16);
  header.resize(360, 36);
  setFill(header, colorShade(ctx.tokens, 'neutral', 50));
  setStroke(header, colorShade(ctx.tokens, 'neutral', 200), 1);

  const col1 = text({ characters: 'MEMBER', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) });
  const col2 = text({ characters: 'ROLE', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) });
  const col3 = text({ characters: 'STATUS', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) });

  header.appendChild(col1); col1.resize(150, 16);
  header.appendChild(col2); col2.resize(80, 16);
  header.appendChild(col3); col3.resize(80, 16);
  root.appendChild(header);

  const tableData: Array<{ name: string; email: string; role: string; roleTone: ColorName; status: string; statusTone: ColorName }> = [
    { name: 'Sarah Connor', email: 'sarah@acme.com', role: 'Admin', roleTone: 'primary', status: 'Active', statusTone: 'success' },
    { name: 'Alex Morgan', email: 'alex@acme.com', role: 'Editor', roleTone: 'information', status: 'Active', statusTone: 'success' },
    { name: 'Marcus Vance', email: 'marcus@acme.com', role: 'Viewer', roleTone: 'neutral', status: 'Pending', statusTone: 'warning' },
  ];

  tableData.forEach((row, r) => {
    const rowEl = makeFrame(`row-${r}`);
    rowEl.layoutMode = 'HORIZONTAL';
    rowEl.primaryAxisAlignItems = 'SPACE_BETWEEN';
    rowEl.counterAxisAlignItems = 'CENTER';
    pad(rowEl, 10, 16);
    rowEl.resize(360, 48);
    if (r < tableData.length - 1) setStroke(rowEl, colorShade(ctx.tokens, 'neutral', 100), 1);

    const userBox = hbox('user');
    userBox.itemSpacing = 8;
    userBox.counterAxisAlignItems = 'CENTER';
    userBox.resize(150, 32);

    const av = makeFrame('av');
    av.resize(28, 28);
    av.cornerRadius = 9999;
    setFill(av, colorShade(ctx.tokens, row.roleTone, 100));
    av.primaryAxisAlignItems = 'CENTER';
    av.counterAxisAlignItems = 'CENTER';
    const initials = row.name.split(' ').map((n) => n[0]).join('');
    av.appendChild(text({ characters: initials, fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, row.roleTone, 700), align: 'CENTER' }));
    userBox.appendChild(av);

    const nameCol = vbox('nameCol');
    nameCol.itemSpacing = 1;
    nameCol.appendChild(text({ characters: row.name, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    nameCol.appendChild(text({ characters: row.email, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 500) }));
    userBox.appendChild(nameCol);
    rowEl.appendChild(userBox);

    const roleTag = makeFrame('roleTag');
    pad(roleTag, 2, 6);
    roleTag.cornerRadius = 4;
    setFill(roleTag, colorShade(ctx.tokens, row.roleTone, 50));
    setStroke(roleTag, colorShade(ctx.tokens, row.roleTone, 200), 1);
    roleTag.appendChild(text({ characters: row.role, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, row.roleTone, 700) }));
    rowEl.appendChild(roleTag);
    roleTag.resize(70, 20);

    const statusPill = hbox('statusPill');
    statusPill.itemSpacing = 4;
    statusPill.counterAxisAlignItems = 'CENTER';
    const dot = ellipse('dot', 6, colorShade(ctx.tokens, row.statusTone, 500));
    statusPill.appendChild(dot);
    statusPill.appendChild(text({ characters: row.status, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, row.statusTone, 700) }));
    rowEl.appendChild(statusPill);
    statusPill.resize(70, 20);

    root.appendChild(rowEl);
  });

  const footer = makeFrame('footer');
  footer.layoutMode = 'HORIZONTAL';
  footer.primaryAxisAlignItems = 'SPACE_BETWEEN';
  footer.counterAxisAlignItems = 'CENTER';
  pad(footer, 8, 16);
  footer.resize(360, 36);
  setFill(footer, colorShade(ctx.tokens, 'neutral', 50));
  setStroke(footer, colorShade(ctx.tokens, 'neutral', 200), 1);
  footer.appendChild(text({ characters: 'Showing 3 of 48 users', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));

  const pageBtns = hbox('pageBtns');
  pageBtns.itemSpacing = 6;
  pageBtns.appendChild(text({ characters: '‹', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  pageBtns.appendChild(text({ characters: '1', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 600) }));
  pageBtns.appendChild(text({ characters: '2', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  pageBtns.appendChild(text({ characters: '›', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  footer.appendChild(pageBtns);

  root.appendChild(footer);
  root.resize(360, 220);
}

const Table: Template = (root, ctx) => {
  populateTable(root, ctx);
  return root;
};

const DataGrid: Template = (root, ctx) => {
  populateTable(root, ctx);
  return root;
};

const List: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = containerRadius(ctx, 'lg', 14);
  setFill(root, '#FFFFFF');
  root.clipsContent = true;

  const items = [
    { label: 'Inbox', count: '12', icon: 'info' as IconKind, active: true },
    { label: 'Starred', count: '4', icon: 'star' as IconKind, active: false },
    { label: 'Sent Messages', count: '48', icon: 'upload' as IconKind, active: false },
    { label: 'Drafts', count: '2', icon: 'file' as IconKind, active: false },
  ];

  items.forEach((item, i) => {
    const itemFrame = makeFrame(`item-${i}`);
    itemFrame.layoutMode = 'HORIZONTAL';
    itemFrame.primaryAxisAlignItems = 'SPACE_BETWEEN';
    itemFrame.counterAxisAlignItems = 'CENTER';
    pad(itemFrame, 10, 14);
    itemFrame.resize(240, 42);

    if (item.active) setFill(itemFrame, colorShade(ctx.tokens, 'primary', 50));
    else itemFrame.fills = [];

    const left = hbox('left');
    left.itemSpacing = 10;
    left.counterAxisAlignItems = 'CENTER';
    left.appendChild(buildIcon(16, item.active ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 500), item.icon));
    left.appendChild(text({ characters: item.label, fontFamily: ctx.config.fontFamily.body, weight: item.active ? 600 : 400, fontSize: 13, fill: item.active ? colorShade(ctx.tokens, 'primary', 900) : colorShade(ctx.tokens, 'neutral', 800) }));
    itemFrame.appendChild(left);

    const countPill = makeFrame('cnt');
    pad(countPill, 2, 6);
    countPill.cornerRadius = 9999;
    setFill(countPill, item.active ? colorShade(ctx.tokens, 'primary', 100) : colorShade(ctx.tokens, 'neutral', 100));
    countPill.appendChild(text({ characters: item.count, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: item.active ? colorShade(ctx.tokens, 'primary', 700) : colorShade(ctx.tokens, 'neutral', 600) }));
    itemFrame.appendChild(countPill);

    root.appendChild(itemFrame);
  });

  root.resize(240, 168);
  return root;
};

const Divider: Template = (root, ctx) => {
  const horizontal = variantKey(ctx) !== 'vertical';
  if (horizontal) {
    root.appendChild(line(200, colorShade(ctx.tokens, 'neutral', 200)));
  } else {
    root.appendChild(rect('divider', 1, 120, colorShade(ctx.tokens, 'neutral', 200)));
  }
  return root;
};

const Modal: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 16;
  pad(root, 24);
  root.cornerRadius = containerRadius(ctx, 'xl', 16);
  setFill(root, '#FFFFFF');
  setEffect(root, shadow(ctx.tokens, 'xl'), effectStyleKey('xl'), ctx.styleMap, ctx.varMap);
  root.resize(380, 230);

  const headRow = makeFrame('headRow');
  headRow.layoutMode = 'HORIZONTAL';
  headRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  headRow.counterAxisAlignItems = 'MIN';
  headRow.resize(332, 44);

  const headLeft = hbox('headLeft');
  headLeft.itemSpacing = 12;
  headLeft.counterAxisAlignItems = 'CENTER';

  const iconCircle = makeFrame('iconCircle');
  iconCircle.resize(36, 36);
  iconCircle.cornerRadius = 9999;
  iconCircle.primaryAxisAlignItems = 'CENTER';
  iconCircle.counterAxisAlignItems = 'CENTER';
  setFill(iconCircle, colorShade(ctx.tokens, 'primary', 100));
  iconCircle.appendChild(buildIcon(18, colorShade(ctx.tokens, 'primary', 600), 'user'));
  headLeft.appendChild(iconCircle);

  const titles = vbox('titles');
  titles.itemSpacing = 2;
  titles.appendChild(text({ characters: 'Invite team members', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  titles.appendChild(text({ characters: 'Add collaborators to this design system.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  headLeft.appendChild(titles);
  headRow.appendChild(headLeft);

  headRow.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 400), 'close'));
  root.appendChild(headRow);

  const emailBox = makeFrame('emailBox');
  emailBox.layoutMode = 'HORIZONTAL';
  emailBox.primaryAxisAlignItems = 'MIN';
  emailBox.counterAxisAlignItems = 'CENTER';
  emailBox.itemSpacing = 8;
  pad(emailBox, 10, 12);
  emailBox.resize(332, 40);
  emailBox.cornerRadius = 8;
  setFill(emailBox, '#FFFFFF');
  setStroke(emailBox, colorShade(ctx.tokens, 'neutral', 300), 1);
  emailBox.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 400), 'mail'));
  emailBox.appendChild(text({ characters: 'colleague@company.com', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  root.appendChild(emailBox);

  const actions = hbox('actions');
  actions.primaryAxisAlignItems = 'MAX';
  actions.counterAxisAlignItems = 'CENTER';
  actions.itemSpacing = 8;
  actions.resize(332, 38);

  const cancel = makeFrame('cancel');
  cancel.layoutMode = 'HORIZONTAL';
  cancel.primaryAxisAlignItems = 'CENTER';
  cancel.counterAxisAlignItems = 'CENTER';
  pad(cancel, 8, 14);
  cancel.cornerRadius = 8;
  setFill(cancel, colorShade(ctx.tokens, 'neutral', 100));
  cancel.appendChild(text({ characters: 'Cancel', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  actions.appendChild(cancel);

  const ok = makeFrame('confirm');
  ok.layoutMode = 'HORIZONTAL';
  ok.primaryAxisAlignItems = 'CENTER';
  ok.counterAxisAlignItems = 'CENTER';
  pad(ok, 8, 16);
  ok.cornerRadius = 8;
  setFill(ok, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  ok.appendChild(text({ characters: 'Send Invites', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: '#FFFFFF' }));
  actions.appendChild(ok);

  root.appendChild(actions);
  return root;
};

const Drawer: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 16;
  pad(root, 24);
  root.cornerRadius = 0;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.resize(280, 420);

  const top = hbox('top');
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.counterAxisAlignItems = 'CENTER';
  top.resize(232, 28);
  top.appendChild(text({ characters: 'Navigation Drawer', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  top.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 400), 'close'));
  root.appendChild(top);

  const navList = vbox('navList');
  navList.itemSpacing = 4;
  ['Overview', 'Team Settings', 'Integrations', 'Billing & Plans', 'API Keys'].forEach((label, i) => {
    const item = makeFrame(`nav-${i}`);
    item.layoutMode = 'HORIZONTAL';
    item.counterAxisAlignItems = 'CENTER';
    item.itemSpacing = 10;
    pad(item, 10, 12);
    item.resize(232, 38);
    item.cornerRadius = 8;
    if (i === 0) setFill(item, colorShade(ctx.tokens, 'primary', 50));
    item.appendChild(buildIcon(16, i === 0 ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 500), 'star'));
    item.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: i === 0 ? 600 : 400, fontSize: 13, fill: i === 0 ? colorShade(ctx.tokens, 'primary', 900) : colorShade(ctx.tokens, 'neutral', 700) }));
    navList.appendChild(item);
  });
  root.appendChild(navList);

  return root;
};

const Tooltip: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 6, 12);
  root.cornerRadius = containerRadius(ctx, 'sm', 6);
  setFill(root, '#0F172A');
  setEffect(root, shadow(ctx.tokens, 'md'), effectStyleKey('md'), ctx.styleMap, ctx.varMap);
  root.appendChild(text({ characters: 'Copy to clipboard', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: '#F8FAFC' }));
  return root;
};

const Popover: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 10;
  pad(root, 14);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, '#FFFFFF');
  setEffect(root, shadow(ctx.tokens, 'lg'), effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.resize(220, 110);

  root.appendChild(text({ characters: 'Quick Info', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Manage notification frequencies and active channels in preferences.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  root.appendChild(text({ characters: 'Configure rules →', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 600) }));
  return root;
};

const DropdownMenu: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 2;
  pad(root, 6);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  setEffect(root, shadow(ctx.tokens, 'lg'), effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  root.resize(200, 160);

  const menuItems = [
    { label: 'View Profile', icon: 'user' as IconKind, isDanger: false },
    { label: 'Settings', icon: 'star' as IconKind, isDanger: false },
    { label: 'Duplicate', icon: 'file' as IconKind, isDanger: false },
    { label: 'Delete Item', icon: 'close' as IconKind, isDanger: true },
  ];

  menuItems.forEach((item, i) => {
    const el = makeFrame(`menu-${i}`);
    el.layoutMode = 'HORIZONTAL';
    el.counterAxisAlignItems = 'CENTER';
    el.itemSpacing = 8;
    pad(el, 7, 10);
    el.cornerRadius = 6;
    el.resize(188, 32);

    const icColor = item.isDanger ? colorShade(ctx.tokens, 'error', 500) : colorShade(ctx.tokens, 'neutral', 500);
    const txtColor = item.isDanger ? colorShade(ctx.tokens, 'error', 600) : colorShade(ctx.tokens, 'neutral', 800);
    el.appendChild(buildIcon(14, icColor, item.icon));
    el.appendChild(text({ characters: item.label, fontFamily: ctx.config.fontFamily.body, weight: item.isDanger ? 500 : 400, fontSize: 13, fill: txtColor }));
    root.appendChild(el);
  });

  return root;
};

const Image: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const isCircle = vKey === 'circle' || vKey === 'avatar';
  const isThumbnail = vKey === 'thumbnail';
  
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  
  if (isCircle) {
    root.resize(80, 80);
    root.cornerRadius = 9999;
  } else if (isThumbnail) {
    root.resize(96, 96);
    root.cornerRadius = containerRadius(ctx, 'md', 12);
  } else {
    root.resize(240, 160);
    root.cornerRadius = containerRadius(ctx, 'lg', 16);
  }

  setFill(root, colorShade(ctx.tokens, 'neutral', 100), colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  
  const iconSize = isCircle || isThumbnail ? 28 : 40;
  const ic = buildIcon(iconSize, colorShade(ctx.tokens, 'neutral', 400), 'image');
  root.appendChild(ic);
  return root;
};

const Accordion: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, '#FFFFFF');
  root.clipsContent = true;

  const item1 = vbox('item1');
  item1.itemSpacing = 0;
  const header1 = makeFrame('header1');
  header1.layoutMode = 'HORIZONTAL';
  header1.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header1.counterAxisAlignItems = 'CENTER';
  pad(header1, 14, 16);
  header1.resize(320, 48);
  header1.appendChild(text({ characters: 'How do design tokens sync to Figma?', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  header1.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 500), 'chevronUp'));
  item1.appendChild(header1);

  const body1 = makeFrame('body1');
  pad(body1, 0, 16);
  body1.paddingBottom = 14;
  body1.resize(320, 50);
  body1.appendChild(text({ characters: 'Tokens export as native Figma styles and variable collections with 1-click sync.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  item1.appendChild(body1);
  root.appendChild(item1);

  const header2 = makeFrame('header2');
  header2.layoutMode = 'HORIZONTAL';
  header2.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header2.counterAxisAlignItems = 'CENTER';
  pad(header2, 14, 16);
  header2.resize(320, 48);
  setStroke(header2, colorShade(ctx.tokens, 'neutral', 100), 1);
  header2.appendChild(text({ characters: 'Can I export to Tailwind and DTCG format?', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  header2.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  root.appendChild(header2);

  root.resize(320, 146);
  return root;
};

const Rating: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  
  const starsBox = hbox('stars');
  starsBox.itemSpacing = 3;
  for (let i = 0; i < 5; i++) {
    const isFilled = i < 4;
    starsBox.appendChild(buildIcon(18, isFilled ? '#F59E0B' : colorShade(ctx.tokens, 'neutral', 300), 'star'));
  }
  root.appendChild(starsBox);
  root.appendChild(text({ characters: '4.8 (124 reviews)', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  return root;
};

const FileUpload: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  let fallbackLabel = 'Dropzone Area';
  if (vKey === 'button') fallbackLabel = 'Upload Button';
  else if (vKey === 'compact' || vKey === 'card') fallbackLabel = 'File Attachment Card';

  const labelText = specimenLabel(ctx, fallbackLabel);
  const lbl = text({
    characters: labelText,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: 13,
    fill: colorShade(ctx.tokens, 'neutral', 700),
  });
  root.appendChild(lbl);

  const isSuccess = sKey === 'complete' || sKey === 'success';
  const isUploading = sKey === 'uploading';
  const isError = sKey === 'error';
  const isHover = sKey === 'hover' || sKey === 'drag' || sKey === 'drag-active' || sKey === 'dragactive';
  const isDisabled = sKey === 'disabled';

  if (vKey === 'button') {
    const btn = makeFrame('btn');
    btn.layoutMode = 'HORIZONTAL';
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';
    btn.itemSpacing = 8;
    pad(btn, 10, 16);
    btn.cornerRadius = pillRadius(ctx, 'md');
    setFill(btn, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
    btn.appendChild(buildIcon(16, '#FFFFFF', 'upload'));
    btn.appendChild(text({ characters: 'Upload File', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: '#FFFFFF' }));
    root.appendChild(btn);
    return root;
  }

  if (vKey === 'compact' || vKey === 'card') {
    const card = makeFrame('fileCard');
    card.layoutMode = 'HORIZONTAL';
    card.counterAxisAlignItems = 'CENTER';
    card.itemSpacing = 12;
    pad(card, 12, 14);
    card.cornerRadius = containerRadius(ctx, 'md', 10);
    card.resize(260, 56);
    setFill(card, '#FFFFFF');
    setStroke(card, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);

    card.appendChild(buildIcon(22, colorShade(ctx.tokens, 'primary', 500), 'file'));

    const meta = vbox('meta');
    meta.itemSpacing = 2;
    meta.appendChild(text({ characters: 'Design_System_v2.pdf', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    meta.appendChild(text({ characters: '2.4 MB • Ready', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'success', 600) }));
    card.appendChild(meta);
    meta.layoutSizingHorizontal = 'FILL';

    card.appendChild(buildIcon(16, colorShade(ctx.tokens, 'success', 500), 'check'));
    root.appendChild(card);
    return root;
  }

  // Dropzone (default)
  const dropzone = makeFrame('dropzone');
  dropzone.layoutMode = 'VERTICAL';
  dropzone.primaryAxisAlignItems = 'CENTER';
  dropzone.counterAxisAlignItems = 'CENTER';
  dropzone.itemSpacing = 8;
  pad(dropzone, 20, 24);
  dropzone.resize(260, 140);
  dropzone.cornerRadius = containerRadius(ctx, 'lg', 14);

  if (isDisabled) {
    setFill(dropzone, colorShade(ctx.tokens, 'neutral', 100));
    setStroke(dropzone, colorShade(ctx.tokens, 'neutral', 300), 1.5, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    root.opacity = 0.5;
  } else if (isSuccess) {
    setFill(dropzone, colorShade(ctx.tokens, 'success', 50));
    setStroke(dropzone, colorShade(ctx.tokens, 'success', 500), 1.5, colorStyleKey('success', 500), ctx.styleMap, ctx.varMap);
  } else if (isUploading) {
    setFill(dropzone, colorShade(ctx.tokens, 'neutral', 50));
    setStroke(dropzone, colorShade(ctx.tokens, 'primary', 400), 1.5, colorStyleKey('primary', 400), ctx.styleMap, ctx.varMap);
  } else if (isError) {
    setFill(dropzone, colorShade(ctx.tokens, 'error', 50));
    setStroke(dropzone, colorShade(ctx.tokens, 'error', 500), 1.5, colorStyleKey('error', 500), ctx.styleMap, ctx.varMap);
  } else if (isHover) {
    setFill(dropzone, colorShade(ctx.tokens, 'primary', 100));
    setStroke(dropzone, colorShade(ctx.tokens, 'primary', 500), 2, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  } else {
    setFill(dropzone, colorShade(ctx.tokens, 'primary', 50));
    setStroke(dropzone, colorShade(ctx.tokens, 'primary', 300), 1.5, colorStyleKey('primary', 300), ctx.styleMap, ctx.varMap);
  }
  dropzone.dashPattern = [6, 4];

  const iconColor = isSuccess ? colorShade(ctx.tokens, 'success', 600) : isUploading ? colorShade(ctx.tokens, 'primary', 600) : isError ? colorShade(ctx.tokens, 'error', 600) : colorShade(ctx.tokens, 'primary', 500);
  const iconKind: IconKind = isSuccess ? 'check' : isUploading ? 'info' : isError ? 'warning' : 'upload';
  dropzone.appendChild(buildIcon(28, iconColor, iconKind));

  const mainTitle = isSuccess ? 'Upload successful!' : isUploading ? 'Uploading file (65%)…' : isError ? 'File format rejected' : 'Drag & drop files here';
  const subTitle = isSuccess ? '1 file ready to process' : isUploading ? 'Please wait a moment…' : isError ? 'Max size: 10MB (PNG, PDF)' : 'or click to browse from device';

  dropzone.appendChild(text({ characters: mainTitle, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: isSuccess ? colorShade(ctx.tokens, 'success', 700) : isUploading ? colorShade(ctx.tokens, 'primary', 700) : isError ? colorShade(ctx.tokens, 'error', 700) : colorShade(ctx.tokens, 'primary', 700), align: 'CENTER' }));
  dropzone.appendChild(text({ characters: subTitle, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500), align: 'CENTER' }));

  root.appendChild(dropzone);
  return root;
};

const DatePicker: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  let fallbackLabel = 'Date Picker';
  if (vKey === 'range') fallbackLabel = 'Date Range';
  else if (vKey === 'multiple') fallbackLabel = 'Multiple Dates';

  const labelText = specimenLabel(ctx, fallbackLabel);
  const lbl = text({
    characters: labelText,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: 13,
    fill: colorShade(ctx.tokens, 'neutral', 700),
  });
  root.appendChild(lbl);

  const cal = makeFrame('cal');
  cal.layoutMode = 'VERTICAL';
  cal.primaryAxisSizingMode = 'AUTO';
  cal.counterAxisSizingMode = 'AUTO';
  cal.itemSpacing = 8;
  pad(cal, 14);
  cal.cornerRadius = containerRadius(ctx, 'lg', 16);
  cal.clipsContent = true;  // clip so content never bleeds outside the card
  setFill(cal, '#FFFFFF');
  setStroke(cal, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  setEffect(cal, shadow(ctx.tokens, 'md'), effectStyleKey('md'), ctx.styleMap, ctx.varMap);
  if (sKey === 'disabled') root.opacity = 0.5;

  // Month navigation header
  const header = makeFrame('header');
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisSizingMode = 'FIXED';
  header.counterAxisSizingMode = 'AUTO';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.resize(252, 28);
  header.fills = [];
  header.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  header.appendChild(text({ characters: 'October 2026', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  header.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  cal.appendChild(header);

  // Day of week headers
  const daysHeader = makeFrame('days-header');
  daysHeader.layoutMode = 'HORIZONTAL';
  daysHeader.primaryAxisSizingMode = 'AUTO';
  daysHeader.counterAxisSizingMode = 'AUTO';
  daysHeader.itemSpacing = 4;
  ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((day) => {
    const dh = text({ characters: day, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 400), align: 'CENTER' });
    dh.resize(32, 20);
    daysHeader.appendChild(dh);
  });
  cal.appendChild(daysHeader);

  // Weekly calendar grid — 5 rows × 7 cols = max 35 days
  let dayNum = 1;
  const isRange = vKey === 'range';
  const isMultiple = vKey === 'multiple';

  for (let r = 0; r < 5; r++) {
    const weekRow = makeFrame(`week-${r + 1}`);
    weekRow.layoutMode = 'HORIZONTAL';
    weekRow.primaryAxisSizingMode = 'AUTO';
    weekRow.counterAxisSizingMode = 'AUTO';
    weekRow.itemSpacing = 4;

    for (let c = 0; c < 7; c++) {
      const cell = makeFrame(`day-${dayNum}`);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'FIXED';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.resize(32, 32);
      cell.cornerRadius = 8;
      cell.clipsContent = true;

      let isSelected = false;
      let inRange = false;

      if (isRange) {
        if (dayNum === 12 || dayNum === 16) isSelected = true;
        else if (dayNum > 12 && dayNum < 16) inRange = true;
      } else if (isMultiple) {
        if (dayNum === 6 || dayNum === 14 || dayNum === 22) isSelected = true;
      } else {
        if (dayNum === 14) isSelected = true;
      }

      if (isSelected) {
        setFill(cell, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
      } else if (inRange) {
        setFill(cell, colorShade(ctx.tokens, 'primary', 100));
      }

      if (dayNum <= 31) {
        const dayTxt = text({
          characters: String(dayNum),
          fontFamily: ctx.config.fontFamily.body,
          weight: isSelected ? 600 : inRange ? 500 : 400,
          fontSize: 12,
          fill: isSelected ? '#FFFFFF' : inRange ? colorShade(ctx.tokens, 'primary', 800) : colorShade(ctx.tokens, 'neutral', 800),
          align: 'CENTER',
        });
        cell.appendChild(dayTxt);
      }
      weekRow.appendChild(cell);
      dayNum++;
    }
    cal.appendChild(weekRow);
  }

  root.appendChild(cal);
  return root;
};

const TimePicker: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  let fallbackLabel = '12-Hour Time';
  if (vKey === '24h' || vKey === 'time24h') fallbackLabel = '24-Hour Time';
  else if (vKey === 'with-seconds' || vKey === 'withseconds') fallbackLabel = 'Time with Seconds';

  const labelText = specimenLabel(ctx, fallbackLabel);
  const lbl = text({
    characters: labelText,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: 13,
    fill: colorShade(ctx.tokens, 'neutral', 700),
  });
  root.appendChild(lbl);

  const picker = makeFrame('picker');
  picker.layoutMode = 'HORIZONTAL';
  picker.primaryAxisSizingMode = 'AUTO';
  picker.counterAxisSizingMode = 'AUTO';
  picker.counterAxisAlignItems = 'CENTER';
  picker.itemSpacing = 6;
  pad(picker, 10, 14);
  picker.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(picker, '#FFFFFF');
  setStroke(picker, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  if (sKey === 'disabled') root.opacity = 0.5;

  const is24h = vKey === '24h' || vKey === 'time24h';
  const withSec = vKey === 'with-seconds' || vKey === 'withseconds';

  const hh = makeFrame('hh');
  pad(hh, 8, 10);
  hh.cornerRadius = containerRadius(ctx, 'sm', 6);
  setFill(hh, colorShade(ctx.tokens, 'neutral', 100));
  hh.appendChild(text({ characters: is24h ? '14' : '09', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  picker.appendChild(hh);

  picker.appendChild(text({ characters: ':', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));

  const mm = makeFrame('mm');
  pad(mm, 8, 10);
  mm.cornerRadius = containerRadius(ctx, 'sm', 6);
  setFill(mm, colorShade(ctx.tokens, 'neutral', 100));
  mm.appendChild(text({ characters: '30', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  picker.appendChild(mm);

  if (withSec) {
    picker.appendChild(text({ characters: ':', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    const ss = makeFrame('ss');
    pad(ss, 8, 10);
    ss.cornerRadius = containerRadius(ctx, 'sm', 6);
    setFill(ss, colorShade(ctx.tokens, 'neutral', 100));
    ss.appendChild(text({ characters: '45', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    picker.appendChild(ss);
  }

  if (!is24h) {
    const ampm = makeFrame('ampm');
    pad(ampm, 6, 8);
    ampm.cornerRadius = 6;
    setFill(ampm, colorShade(ctx.tokens, 'primary', 100));
    ampm.appendChild(text({ characters: 'AM', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'primary', 700) }));
    picker.appendChild(ampm);
  }

  root.appendChild(picker);
  return root;
};

const ColorPicker: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 6;
  root.fills = [];

  let fallbackLabel = 'Color Palette';
  if (vKey === 'swatches') fallbackLabel = 'Color Swatches';

  const labelText = specimenLabel(ctx, fallbackLabel);
  const lbl = text({
    characters: labelText,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: 13,
    fill: colorShade(ctx.tokens, 'neutral', 700),
  });
  root.appendChild(lbl);

  const container = makeFrame('container');
  container.layoutMode = 'VERTICAL';
  container.itemSpacing = 10;
  pad(container, 14);
  container.cornerRadius = containerRadius(ctx, 'lg', 14);
  setFill(container, '#FFFFFF');
  setStroke(container, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  setEffect(container, shadow(ctx.tokens, 'md'), effectStyleKey('md'), ctx.styleMap, ctx.varMap);
  if (sKey === 'disabled') root.opacity = 0.5;

  if (vKey === 'swatches') {
    const paletteGrid = vbox('paletteGrid');
    paletteGrid.itemSpacing = 8;
    const swatchColors = [
      ['#EF4444', '#F97316', '#F59E0B', '#10B981'],
      ['#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6'],
      ['#EC4899', '#64748B', '#0F172A', '#FFFFFF'],
    ];
    swatchColors.forEach((row) => {
      const r = hbox('row');
      r.itemSpacing = 8;
      row.forEach((col) => {
        const sw = ellipse('sw', 24, col);
        setStroke(sw, colorShade(ctx.tokens, 'neutral', 200), 1);
        r.appendChild(sw);
      });
      paletteGrid.appendChild(r);
    });
    container.appendChild(paletteGrid);
    root.appendChild(container);
    return root;
  }

  // Saturation preview
  const sat = makeFrame('saturation');
  sat.resize(200, 90);
  sat.cornerRadius = 8;
  setFill(sat, colorShade(ctx.tokens, 'primary', 500));
  sat.primaryAxisAlignItems = 'MAX';
  sat.counterAxisAlignItems = 'MIN';
  pad(sat, 8);
  const ringHandle = ellipse('ringHandle', 14, '#FFFFFF');
  setStroke(ringHandle, colorShade(ctx.tokens, 'neutral', 900), 2);
  sat.appendChild(ringHandle);
  container.appendChild(sat);

  // Hex input & Opacity
  const hexRow = hbox('hexRow');
  hexRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
  hexRow.counterAxisAlignItems = 'CENTER';
  hexRow.resize(200, 28);
  pad(hexRow, 4, 8);
  hexRow.cornerRadius = 6;
  setFill(hexRow, colorShade(ctx.tokens, 'neutral', 100));
  hexRow.appendChild(text({ characters: '#3B82F6', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  hexRow.appendChild(text({ characters: '100%', fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  container.appendChild(hexRow);

  // Swatches row
  const swatches = hbox('swatches');
  swatches.itemSpacing = 8;
  ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#0F172A'].forEach((c, i) => {
    const s = ellipse(`sw-${i}`, 18, c);
    setStroke(s, '#FFFFFF', 1.5);
    swatches.appendChild(s);
  });
  container.appendChild(swatches);

  root.appendChild(container);
  return root;
};

const Grid: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 10;
  root.fills = [];
  for (let i = 0; i < 4; i++) {
    const cell = makeFrame(`cell-${i}`);
    cell.resize(56, 56);
    cell.cornerRadius = 8;
    setFill(cell, colorShade(ctx.tokens, 'primary', 50));
    setStroke(cell, colorShade(ctx.tokens, 'primary', 200), 1);
    cell.primaryAxisAlignItems = 'CENTER';
    cell.counterAxisAlignItems = 'CENTER';
    cell.appendChild(text({ characters: `Col ${i + 1}`, fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 700) }));
    root.appendChild(cell);
  }
  return root;
};

const Stack: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  root.fills = [];
  for (let i = 0; i < 3; i++) {
    const item = makeFrame(`item-${i}`);
    item.resize(180, 28);
    item.cornerRadius = 6;
    pad(item, 6, 10);
    setFill(item, colorShade(ctx.tokens, 'neutral', 50));
    setStroke(item, colorShade(ctx.tokens, 'neutral', 200), 1);
    item.counterAxisAlignItems = 'CENTER';
    item.appendChild(text({ characters: `Stack item ${i + 1}`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
    root.appendChild(item);
  }
  return root;
};

const Container: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  pad(root, 16);
  root.cornerRadius = containerRadius(ctx, 'lg', 16);
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.resize(300, 150);

  const head = hbox('head');
  head.primaryAxisAlignItems = 'SPACE_BETWEEN';
  head.counterAxisAlignItems = 'CENTER';
  head.resize(268, 24);
  head.appendChild(text({ characters: 'Container Area', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  
  const tag = makeFrame('tag');
  pad(tag, 2, 6);
  tag.cornerRadius = 4;
  setFill(tag, colorShade(ctx.tokens, 'neutral', 100));
  tag.appendChild(text({ characters: 'Fluid (Max: 1280px)', fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  head.appendChild(tag);
  root.appendChild(head);

  const inner = makeFrame('inner');
  inner.resize(268, 70);
  inner.cornerRadius = 8;
  setFill(inner, colorShade(ctx.tokens, 'neutral', 50));
  setStroke(inner, colorShade(ctx.tokens, 'neutral', 200), 1);
  inner.primaryAxisAlignItems = 'CENTER';
  inner.counterAxisAlignItems = 'CENTER';
  inner.appendChild(text({ characters: 'Main Content Body', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  root.appendChild(inner);

  return root;
};

const ScrollArea: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 8;
  pad(root, 10);
  root.cornerRadius = containerRadius(ctx, 'md', 12);
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.resize(240, 160);

  const list = vbox('list');
  list.itemSpacing = 6;
  list.resize(200, 140);
  for (let i = 0; i < 4; i++) {
    const row = makeFrame(`row-${i}`);
    row.resize(200, 28);
    row.cornerRadius = 6;
    pad(row, 6, 8);
    setFill(row, colorShade(ctx.tokens, 'neutral', 50));
    row.counterAxisAlignItems = 'CENTER';
    row.appendChild(text({ characters: `Scrollable item ${i + 1}`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
    list.appendChild(row);
  }
  root.appendChild(list);

  // Scrollbar
  const scrollbar = makeFrame('scrollbar');
  scrollbar.resize(4, 140);
  scrollbar.cornerRadius = 9999;
  setFill(scrollbar, colorShade(ctx.tokens, 'neutral', 100));
  const thumb = rect('thumb', 4, 40, colorShade(ctx.tokens, 'neutral', 300));
  thumb.cornerRadius = 9999;
  scrollbar.appendChild(thumb);
  root.appendChild(scrollbar);

  return root;
};

const Icon: Template = (root, ctx) => {
  const sz = Number(ctx.sizeProps.dimension ?? ctx.sizeProps.height ?? 24);
  root.appendChild(buildIcon(sz, colorShade(ctx.tokens, 'neutral', 700), 'star'));
  return root;
};

const Link: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 4;
  const t = text({ characters: 'Explore documentation', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'primary', 600) });
  root.appendChild(t);
  root.appendChild(buildIcon(12, colorShade(ctx.tokens, 'primary', 600), 'chevronDown'));
  return root;
};

// ---------------- registry ----------------

export const TEMPLATES: Record<string, Template> = {
  Button,
  IconButton,
  ButtonGroup,
  Input,
  Textarea,
  Select,
  Checkbox,
  Radio,
  Switch,
  Slider,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Alert,
  Toast,
  Badge,
  Tag,
  Avatar,
  AvatarStack,
  Progress,
  Spinner,
  Skeleton,
  EmptyState,
  Tabs,
  Breadcrumb,
  Pagination,
  Stepper,
  Table,
  DataGrid,
  List,
  Divider,
  Modal,
  Drawer,
  Tooltip,
  Popover,
  DropdownMenu,
  Image,
  Accordion,
  Rating,
  FileUpload,
  DatePicker,
  TimePicker,
  ColorPicker,
  Grid,
  Stack,
  Container,
  ScrollArea,
  Icon,
  Link,
};
