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
  variantProps: Record<string, any>;
  stateName: string;
  stateProps: Record<string, any>;
  sizeName: string;
  sizeProps: Record<string, any>;
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

function isOutlined(ctx: TemplateCtx): boolean {
  const v = variantKey(ctx);
  return ['ghost', 'outline', 'text'].includes(v);
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

function buildIcon(size: number, hex: string, kind: 'circle' | 'square' | 'ring' = 'circle'): FrameNode {
  const f = makeFrame('icon');
  if (kind === 'ring') {
    const e = ellipse('ring', size, hex);
    e.strokes = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    e.strokeWeight = size * 0.12;
    e.fills = [];
    f.appendChild(e);
  } else if (kind === 'square') {
    const r = rect('icon-shape', size, size, hex);
    f.appendChild(r);
  } else {
    const e = ellipse('icon-shape', size, hex);
    f.appendChild(e);
  }
  return f;
}

function buildSpinner(size: number, hex: string): FrameNode {
  const f = makeFrame('spinner');
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
  const outlined = isOutlined(ctx);
  const filled = !outlined;
  const baseShade = ctx.stateName.toLowerCase() === 'hover' ? 600 : ctx.stateName.toLowerCase() === 'active' ? 700 : 500;
  const fillHex = filled ? colorShade(ctx.tokens, t, baseShade) : '#FFFFFF';
  const textHex = filled ? '#FFFFFF' : colorShade(ctx.tokens, t, 600);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  pad(root, Math.round(m.height / 2 - m.fontSize * 0.7), m.padX);
  root.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : ctx.config.radiusPreset === 'sharp' ? 0 : radiusPx(ctx.tokens, 'md');
  setFill(root, fillHex, colorStyleKey(t, baseShade), ctx.styleMap, ctx.varMap);
  if (outlined) setStroke(root, colorShade(ctx.tokens, t, 300), 1, colorStyleKey(t, 300), ctx.styleMap, ctx.varMap);
  root.opacity = disabledOpacity(ctx);

  const loading = ctx.stateName.toLowerCase() === 'loading';
  if (loading) root.appendChild(buildSpinner(m.fontSize + 4, textHex));
  const label = text({
    characters: ctx.def.name === 'IconButton' ? '' : 'Button',
    fontFamily: ctx.config.fontFamily.body,
    weight: 600,
    fontSize: m.fontSize,
    fill: textHex,
  });
  if (!loading) root.appendChild(label);
  return root;
};

const IconButton: Template = (root, ctx) => {
  const t = tone(ctx);
  const m = sizeMetrics(ctx);
  const outlined = isOutlined(ctx);
  const baseShade = ctx.stateName.toLowerCase() === 'hover' ? 600 : ctx.stateName.toLowerCase() === 'active' ? 700 : 500;
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 0);
  root.resize(m.height, m.height);
  root.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : radiusPx(ctx.tokens, 'md');
  setFill(root, outlined ? '#FFFFFF' : colorShade(ctx.tokens, t, baseShade), colorStyleKey(t, baseShade), ctx.styleMap, ctx.varMap);
  if (outlined) setStroke(root, colorShade(ctx.tokens, t, 300), 1, colorStyleKey(t, 300), ctx.styleMap, ctx.varMap);
  root.opacity = disabledOpacity(ctx);
  root.appendChild(buildIcon(m.height * 0.45, outlined ? colorShade(ctx.tokens, t, 600) : '#FFFFFF'));
  return root;
};

const ButtonGroup: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 0;
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  for (const [i, label] of SEGMENT_LABELS.entries()) {
    const b = makeFrame(`item-${i}`);
    b.layoutMode = 'HORIZONTAL';
    b.primaryAxisAlignItems = 'CENTER';
    b.counterAxisAlignItems = 'CENTER';
    pad(b, 8, 14);
    const selected = i === 1;
    setFill(b, selected ? colorShade(ctx.tokens, 'primary', 500) : '#FFFFFF', colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
    b.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: selected ? 600 : 400, fontSize: 14, fill: selected ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 700) }));
    root.appendChild(b);
  }
  return root;
};

function buildField(ctx: TemplateCtx): { frame: FrameNode; input: FrameNode } {
  const field = vbox('field');
  field.itemSpacing = 6;
  const lbl = text({ characters: 'Label', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 700) });
  field.appendChild(lbl);
  lbl.layoutAlign = 'STRETCH';

  const input = makeFrame('control');
  input.layoutMode = 'HORIZONTAL';
  input.primaryAxisAlignItems = 'CENTER';
  input.counterAxisAlignItems = 'CENTER';
  input.itemSpacing = 8;
  pad(input, 10, 12);
  input.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(input, '#FFFFFF');
  const err = ['error', 'invalid'].includes(ctx.stateName.toLowerCase());
  setStroke(input, err ? colorShade(ctx.tokens, 'error', 500) : colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
  if (ctx.stateName.toLowerCase() === 'focus') setStroke(input, colorShade(ctx.tokens, 'primary', 500), 2, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  input.resize(280, 40);
  field.appendChild(input);
  return { frame: field, input };
}

const Input: Template = (root, ctx) => {
  const { frame, input } = buildField(ctx);
  input.appendChild(text({ characters: 'Placeholder', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  root.appendChild(frame);
  return root;
};

const Textarea: Template = (root, ctx) => {
  const { frame, input } = buildField(ctx);
  input.layoutMode = 'VERTICAL';
  input.primaryAxisAlignItems = 'MIN';
  input.counterAxisAlignItems = 'MIN';
  input.resize(280, 96);
  const ta = text({ characters: 'Enter your message…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 400) });
  ta.textAutoResize = 'HEIGHT';
  input.appendChild(ta);
  root.appendChild(frame);
  return root;
};

const Select: Template = (root, ctx) => {
  const { frame, input } = buildField(ctx);
  input.appendChild(text({ characters: 'Select an option', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  input.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 500), 'square'));
  root.appendChild(frame);
  return root;
};

const Checkbox: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  const box = rect('box', 20, 20, ctx.stateName.toLowerCase() === 'default' ? '#FFFFFF' : colorShade(ctx.tokens, 'primary', 500));
  box.cornerRadius = radiusPx(ctx.tokens, 'sm');
  setStroke(box, colorShade(ctx.tokens, 'primary', 500), 1.5, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  root.appendChild(box);
  root.appendChild(text({ characters: 'Checkbox label', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.opacity = disabledOpacity(ctx);
  return root;
};

const Radio: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  const ring = makeFrame('ring');
  ring.layoutMode = 'HORIZONTAL';
  ring.primaryAxisAlignItems = 'CENTER';
  ring.counterAxisAlignItems = 'CENTER';
  ring.resize(20, 20);
  const ringShape = ellipse('ring-shape', 20, ctx.stateName.toLowerCase() === 'default' ? '#FFFFFF' : colorShade(ctx.tokens, 'primary', 500));
  setStroke(ringShape, colorShade(ctx.tokens, 'primary', 500), 1.5, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  ring.appendChild(ringShape);
  ringShape.layoutPositioning = 'ABSOLUTE';
  if (ctx.stateName.toLowerCase() !== 'default') {
    const dot = ellipse('dot', 10, colorShade(ctx.tokens, 'primary', 500));
    ring.appendChild(dot);
    dot.layoutPositioning = 'ABSOLUTE';
    dot.x = 5; dot.y = 5;
  }
  root.appendChild(ring);
  root.appendChild(text({ characters: 'Radio option', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.opacity = disabledOpacity(ctx);
  return root;
};

const Switch: Template = (root, ctx) => {
  const on = !['default', 'off'].includes(ctx.stateName.toLowerCase());
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(44, 24);
  root.cornerRadius = 9999;
  setFill(root, on ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 300), on ? colorStyleKey('primary', 500) : colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
  const knob = ellipse('knob', 18, '#FFFFFF');
  knob.x = on ? 22 : 3;
  knob.y = 3;
  root.appendChild(knob);
  root.opacity = disabledOpacity(ctx);
  return root;
};

const Slider: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 0;
  root.resize(200, 24);
  const track = makeFrame('track');
  track.resize(200, 6);
  track.cornerRadius = 9999;
  setFill(track, colorShade(ctx.tokens, 'neutral', 200));
  const fill = rect('fill', 120, 6, colorShade(ctx.tokens, 'primary', 500));
  fill.cornerRadius = 9999;
  track.appendChild(fill);
  root.appendChild(track);
  const knob = ellipse('knob', 18, '#FFFFFF');
  setStroke(knob, colorShade(ctx.tokens, 'primary', 500), 2, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  knob.x = 111;
  knob.y = 3;
  root.appendChild(knob);
  return root;
};

const CardFrame = (root: ComponentNode, ctx: TemplateCtx, elevated: boolean) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  pad(root, 20);
  root.cornerRadius = radiusPx(ctx.tokens, 'lg');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  if (elevated) setEffect(root, shadow(ctx.tokens, 'md')!, effectStyleKey('md'), ctx.styleMap, ctx.varMap);
  root.resize(320, 200);
};

const Card: Template = (root, ctx) => {
  CardFrame(root, ctx, true);
  root.appendChild(text({ characters: 'Card Title', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Card content describing the component body text.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  return root;
};

const CardHeader: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 4;
  pad(root, 16);
  root.appendChild(text({ characters: 'Header', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Subtitle text', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const CardContent: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 16);
  root.appendChild(text({ characters: 'Body content of the card goes here.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  return root;
};

const CardFooter: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'MAX';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  pad(root, 16);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.appendChild(text({ characters: 'Cancel', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  root.appendChild(text({ characters: 'OK', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'primary', 600) }));
  return root;
};

function populateAlert(root: ComponentNode, ctx: TemplateCtx, toneName: ColorName): void {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 12;
  pad(root, 14, 16);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, colorShade(ctx.tokens, toneName, 50), colorStyleKey(toneName, 50), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, toneName, 200), 1, colorStyleKey(toneName, 200), ctx.styleMap, ctx.varMap);
  root.resize(360, 60);
  root.appendChild(buildIcon(20, colorShade(ctx.tokens, toneName, 500)));
  const tf = vbox('text');
  tf.itemSpacing = 2;
  tf.appendChild(text({ characters: titleCase(toneName), fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, toneName, 700) }));
  tf.appendChild(text({ characters: `This is a ${toneName} message.`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, toneName, 600) }));
  root.appendChild(tf);
}

const Alert: Template = (root, ctx) => {
  populateAlert(root, ctx, tone(ctx));
  return root;
};

const Toast: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 12;
  pad(root, 12, 16);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#1E293B');
  setEffect(root, shadow(ctx.tokens, 'lg')!, effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  root.resize(320, 56);
  root.appendChild(buildIcon(18, colorShade(ctx.tokens, t, 400)));
  root.appendChild(text({ characters: 'Operation completed', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: '#F8FAFC' }));
  return root;
};

const Badge: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 2, 8);
  root.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : radiusPx(ctx.tokens, 'sm');
  setFill(root, colorShade(ctx.tokens, t, 100), colorStyleKey(t, 100), ctx.styleMap, ctx.varMap);
  root.appendChild(text({ characters: 'Badge', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, t, 700) }));
  return root;
};

const Tag: Template = (root, ctx) => {
  const t = tone(ctx);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  pad(root, 4, 10);
  root.cornerRadius = ctx.config.radiusPreset === 'pill' ? 9999 : radiusPx(ctx.tokens, 'sm');
  setFill(root, colorShade(ctx.tokens, t, 100), colorStyleKey(t, 100), ctx.styleMap, ctx.varMap);
  root.appendChild(text({ characters: 'Tag', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, t, 700) }));
  if (variantKey(ctx).includes('removable')) {
    const x = text({ characters: '×', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 14, fill: colorShade(ctx.tokens, t, 600) });
    root.appendChild(x);
  }
  return root;
};

const Avatar: Template = (root, ctx) => {
  const d = Number(ctx.sizeProps.dimension ?? 40);
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(d, d);
  root.cornerRadius = Number(ctx.variantProps.variant) === 0 || ctx.variantProps.variant === 'square' ? radiusPx(ctx.tokens, 'md') : 9999;
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
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(200, 8);
  const track = makeFrame('track');
  track.resize(200, 8);
  track.cornerRadius = 9999;
  setFill(track, colorShade(ctx.tokens, 'neutral', 200));
  const fill = rect('fill', 140, 8, colorShade(ctx.tokens, 'primary', 500));
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
  root.itemSpacing = 8;
  root.appendChild(rect('line-1', 200, 14, colorShade(ctx.tokens, 'neutral', 100)));
  root.appendChild(rect('line-2', 160, 14, colorShade(ctx.tokens, 'neutral', 100)));
  root.appendChild(rect('line-3', 120, 14, colorShade(ctx.tokens, 'neutral', 100)));
  return root;
};

const EmptyState: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 10;
  pad(root, 32);
  setFill(root, colorShade(ctx.tokens, 'neutral', 50));
  root.cornerRadius = radiusPx(ctx.tokens, 'lg');
  root.appendChild(buildIcon(48, colorShade(ctx.tokens, 'neutral', 300), 'square'));
  root.appendChild(text({ characters: 'No results found', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.appendChild(text({ characters: 'Try adjusting your search or filters.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const Tabs: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 4;
  pad(root, 4);
  setFill(root, colorShade(ctx.tokens, 'neutral', 100));
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  ['Account', 'Security', 'Billing'].forEach((label, i) => {
    const tab = makeFrame(`tab-${i}`);
    tab.layoutMode = 'HORIZONTAL';
    tab.primaryAxisAlignItems = 'CENTER';
    tab.counterAxisAlignItems = 'CENTER';
    pad(tab, 8, 14);
    tab.cornerRadius = radiusPx(ctx.tokens, 'sm');
    const active = i === 0;
    setFill(tab, active ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 100), active ? undefined : colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
    if (active) setEffect(tab, shadow(ctx.tokens, 'xs')!, effectStyleKey('xs'), ctx.styleMap, ctx.varMap);
    tab.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? colorShade(ctx.tokens, 'primary', 700) : colorShade(ctx.tokens, 'neutral', 600) }));
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
    cell.cornerRadius = radiusPx(ctx.tokens, 'md');
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

function populateTable(root: ComponentNode, ctx: TemplateCtx, rows: number, cols: string[]): void {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  const header = makeFrame('row-header');
  header.layoutMode = 'HORIZONTAL';
  header.itemSpacing = 0;
  header.counterAxisAlignItems = 'CENTER';
  pad(header, 12, 16);
  setFill(header, colorShade(ctx.tokens, 'neutral', 50));
  cols.forEach((c) => {
    const cell = text({ characters: c, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 600) });
    header.appendChild(cell);
    cell.layoutSizingHorizontal = 'FILL';
  });
  root.appendChild(header);
  for (let r = 0; r < rows; r++) {
    const rowEl = makeFrame(`row-${r}`);
    rowEl.layoutMode = 'HORIZONTAL';
    rowEl.itemSpacing = 0;
    rowEl.counterAxisAlignItems = 'CENTER';
    pad(rowEl, 12, 16);
    if (r % 2 === 1) setFill(rowEl, colorShade(ctx.tokens, 'neutral', 50));
    cols.forEach((_, c) => {
      const cell = text({ characters: `Item ${r + 1}.${c + 1}`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 700) });
      rowEl.appendChild(cell);
      cell.layoutSizingHorizontal = 'FILL';
    });
    root.appendChild(rowEl);
  }
  root.resize(360, 48 + rows * 44);
}

const Table: Template = (root, ctx) => {
  populateTable(root, ctx, 4, ['Name', 'Status', 'Role']);
  return root;
};

const DataGrid: Template = (root, ctx) => {
  populateTable(root, ctx, 6, ['ID', 'Name', 'Status', 'Actions']);
  return root;
};

const List: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  ['Inbox', 'Starred', 'Sent', 'Drafts'].forEach((label, i, arr) => {
    const item = makeFrame(`item-${i}`);
    item.layoutMode = 'HORIZONTAL';
    item.counterAxisAlignItems = 'CENTER';
    item.itemSpacing = 10;
    pad(item, 12, 14);
    if (i < arr.length - 1) setStroke(item, colorShade(ctx.tokens, 'neutral', 100), 1, colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
    item.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 500)));
    item.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    root.appendChild(item);
  });
  root.resize(220, 4 * 48);
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
  root.itemSpacing = 12;
  pad(root, 24);
  root.cornerRadius = radiusPx(ctx.tokens, 'xl');
  setFill(root, '#FFFFFF');
  setEffect(root, shadow(ctx.tokens, 'xl')!, effectStyleKey('xl'), ctx.styleMap, ctx.varMap);
  root.resize(400, 220);
  root.appendChild(text({ characters: 'Modal Title', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 20, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Modal body text describing the action.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  const actions = hbox('actions');
  actions.primaryAxisAlignItems = 'MAX';
  actions.itemSpacing = 8;
  const cancel = makeFrame('cancel');
  cancel.layoutMode = 'HORIZONTAL';
  cancel.primaryAxisAlignItems = 'CENTER';
  cancel.counterAxisAlignItems = 'CENTER';
  pad(cancel, 8, 16);
  cancel.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(cancel, colorShade(ctx.tokens, 'neutral', 100));
  cancel.appendChild(text({ characters: 'Cancel', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  actions.appendChild(cancel);
  const ok = makeFrame('confirm');
  ok.layoutMode = 'HORIZONTAL';
  ok.primaryAxisAlignItems = 'CENTER';
  ok.counterAxisAlignItems = 'CENTER';
  pad(ok, 8, 16);
  ok.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(ok, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
  ok.appendChild(text({ characters: 'Confirm', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 14, fill: '#FFFFFF' }));
  actions.appendChild(ok);
  root.appendChild(actions);
  return root;
};

const Drawer: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  pad(root, 20);
  root.cornerRadius = 0;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.resize(280, 480);
  root.appendChild(text({ characters: 'Drawer', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 18, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  for (let i = 0; i < 5; i++) {
    root.appendChild(text({ characters: `Menu item ${i + 1}`, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  }
  return root;
};

const Tooltip: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 6, 10);
  root.cornerRadius = radiusPx(ctx.tokens, 'sm');
  setFill(root, '#0F172A');
  root.appendChild(text({ characters: 'Tooltip', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: '#F8FAFC' }));
  return root;
};

const Popover: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 2;
  pad(root, 8);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setEffect(root, shadow(ctx.tokens, 'lg')!, effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  ['Profile', 'Settings', 'Sign out'].forEach((label, i) => {
    const item = makeFrame(`item-${i}`);
    pad(item, 8, 10);
    item.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    root.appendChild(item);
  });
  root.resize(180, 130);
  return root;
};

const DropdownMenu: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 2;
  pad(root, 6);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setEffect(root, shadow(ctx.tokens, 'lg')!, effectStyleKey('lg'), ctx.styleMap, ctx.varMap);
  ['Edit', 'Duplicate', 'Archive', 'Delete'].forEach((label, i) => {
    const item = makeFrame(`item-${i}`);
    pad(item, 8, 10);
    item.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: i === 3 ? 500 : 400, fontSize: 14, fill: i === 3 ? colorShade(ctx.tokens, 'error', 600) : colorShade(ctx.tokens, 'neutral', 800) }));
    root.appendChild(item);
  });
  root.resize(170, 150);
  return root;
};

const Image: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(160, 120);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, colorShade(ctx.tokens, 'neutral', 200));
  const ic = buildIcon(40, colorShade(ctx.tokens, 'neutral', 400), 'square');
  root.appendChild(ic);
  return root;
};

const Accordion: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 0;
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  const header = makeFrame('header');
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  pad(header, 14, 16);
  header.appendChild(text({ characters: 'Section', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  header.appendChild(text({ characters: '▾', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  root.appendChild(header);
  const body = makeFrame('body');
  pad(body, 14, 16);
  body.appendChild(text({ characters: 'Accordion content goes here.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  root.appendChild(body);
  root.resize(320, 96);
  return root;
};

const Rating: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 4;
  for (let i = 0; i < 5; i++) {
    const star = makeFrame(`star-${i}`);
    star.layoutMode = 'HORIZONTAL';
    star.primaryAxisAlignItems = 'CENTER';
    star.counterAxisAlignItems = 'CENTER';
    star.resize(24, 24);
    setFill(star, i < 4 ? colorShade(ctx.tokens, 'warning', 400) : colorShade(ctx.tokens, 'neutral', 200), i < 4 ? colorStyleKey('warning', 400) : colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
    star.cornerRadius = 4;
    star.appendChild(text({ characters: '★', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 14, fill: i < 4 ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 500), align: 'CENTER' }));
    root.appendChild(star);
  }
  return root;
};

const FileUpload: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  pad(root, 24);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, colorShade(ctx.tokens, 'primary', 50));
  setStroke(root, colorShade(ctx.tokens, 'primary', 300), 1.5, colorStyleKey('primary', 300), ctx.styleMap, ctx.varMap);
  (root as any).dashPattern = [6, 4];
  root.appendChild(buildIcon(36, colorShade(ctx.tokens, 'primary', 500)));
  root.appendChild(text({ characters: 'Drag & drop files here', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'primary', 700) }));
  root.appendChild(text({ characters: 'or click to browse', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const DatePicker: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 12);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  const header = makeFrame('header');
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.appendChild(text({ characters: 'July 2026', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(header);
  const grid = makeFrame('grid');
  grid.layoutMode = 'HORIZONTAL';
  grid.itemSpacing = 4;
  grid.fills = [];
  for (let w = 0; w < 7; w++) {
    const col = vbox(`col-${w}`);
    col.itemSpacing = 4;
    for (let d = 0; d < 5; d++) {
      const cell = makeFrame(`d-${w}-${d}`);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.resize(28, 28);
      cell.cornerRadius = 9999;
      if (w === 2 && d === 2) setFill(cell, colorShade(ctx.tokens, 'primary', 500), colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
      cell.appendChild(text({ characters: String(w * 5 + d + 1), fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: w === 2 && d === 2 ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 700), align: 'CENTER' }));
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
  root.appendChild(grid);
  root.resize(240, 220);
  return root;
};

const TimePicker: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  pad(root, 12);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  const hh = makeFrame('hh');
  pad(hh, 10, 12);
  hh.cornerRadius = radiusPx(ctx.tokens, 'sm');
  setFill(hh, colorShade(ctx.tokens, 'neutral', 100));
  hh.appendChild(text({ characters: '09', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 20, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(hh);
  root.appendChild(text({ characters: ':', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 20, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  const mm = makeFrame('mm');
  pad(mm, 10, 12);
  mm.cornerRadius = radiusPx(ctx.tokens, 'sm');
  setFill(mm, colorShade(ctx.tokens, 'neutral', 100));
  mm.appendChild(text({ characters: '30', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 20, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(mm);
  root.appendChild(text({ characters: 'AM', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  return root;
};

const ColorPicker: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 12);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  const sat = rect('saturation', 200, 120, colorShade(ctx.tokens, 'primary', 500));
  sat.cornerRadius = radiusPx(ctx.tokens, 'sm');
  root.appendChild(sat);
  const swatches = hbox('swatches');
  swatches.itemSpacing = 6;
  ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'].forEach((c, i) => {
    const s = ellipse(`sw-${i}`, 20, c);
    swatches.appendChild(s);
  });
  root.appendChild(swatches);
  root.resize(224, 180);
  return root;
};

const Grid: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 12;
  root.fills = [];
  for (let i = 0; i < 4; i++) {
    root.appendChild(rect(`cell-${i}`, 60, 60, colorShade(ctx.tokens, 'primary', 100)));
  }
  return root;
};

const Stack: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  root.fills = [];
  for (let i = 0; i < 3; i++) root.appendChild(rect(`item-${i}`, 160, 24, colorShade(ctx.tokens, 'neutral', 100)));
  return root;
};

const Container: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  pad(root, 16);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, colorShade(ctx.tokens, 'neutral', 50));
  root.resize(320, 160);
  root.appendChild(text({ characters: 'Container', fontFamily: ctx.config.fontFamily.heading, weight: 600, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(rect('content', 288, 80, '#FFFFFF'));
  return root;
};

const ScrollArea: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  pad(root, 12);
  root.cornerRadius = radiusPx(ctx.tokens, 'md');
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
  for (let i = 0; i < 6; i++) root.appendChild(rect(`row-${i}`, 200, 32, colorShade(ctx.tokens, 'neutral', 100)));
  root.resize(240, 180);
  return root;
};

const Icon: Template = (root, ctx) => {
  root.appendChild(buildIcon(24, colorShade(ctx.tokens, 'neutral', 700), 'square'));
  return root;
};

const Link: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  const t = text({ characters: 'Link text', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'primary', 600) });
  root.appendChild(t);
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
