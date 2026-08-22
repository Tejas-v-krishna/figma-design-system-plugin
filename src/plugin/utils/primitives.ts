// Low-level Figma node builders used by every component template.
import { hexToRgb } from '../../shared/color-utils';
import { StyleMap } from './styleKeys';
import { VariableMap } from './variables';
import { resolveFont } from './fonts';

export function fontStyleFor(weight: number): string {
  if (weight >= 600) return 'Semi Bold';
  if (weight >= 500) return 'Medium';
  return 'Regular';
}

export function makeFrame(name: string): FrameNode {
  const f = figma.createFrame();
  f.name = name;
  f.fills = [];
  f.clipsContent = false;
  return f;
}

export function makeComponent(name: string): ComponentNode {
  const c = figma.createComponent();
  c.name = name;
  c.fills = [];
  return c;
}

/**
 * Resolve a color variable for `styleKey`, preferring the highest tier that
 * defines it: Component (Tier 3) → Semantic (Tier 2) → Primitive (Tier 1).
 */
export function resolveColorVariable(
  varMap: VariableMap | undefined,
  styleKey?: string
): Variable | undefined {
  if (!varMap || !styleKey) return undefined;
  return varMap.component[styleKey] ?? varMap.semantic[styleKey] ?? varMap.primitive[styleKey];
}

/** Apply a solid fill, optionally binding a Paint Style or Variable by key. */
export async function setFill(
  node: MinimalFills,
  hex: string,
  styleKey?: string,
  styleMap?: StyleMap,
  varMap?: VariableMap
): Promise<void> {
  let fill: Paint = { type: 'SOLID', color: hexToRgb(hex) };
  const variable = resolveColorVariable(varMap, styleKey);
  if (styleKey && variable) {
    fill = figma.variables.setBoundVariableForPaint(fill as SolidPaint, 'color', variable);
  } else if (styleKey && styleMap?.color[styleKey]) {
    const id = styleMap.color[styleKey];
    if ('setFillStyleIdAsync' in node) {
      try {
        await (node as any).setFillStyleIdAsync(id);
      } catch {
        /* fallback */
      }
    }
  }
  node.fills = [fill];
}

export async function setStroke(
  node: MinimalStrokes,
  hex: string,
  weight = 1,
  styleKey?: string,
  styleMap?: StyleMap,
  varMap?: VariableMap
): Promise<void> {
  let stroke: Paint = { type: 'SOLID', color: hexToRgb(hex) };
  const variable = resolveColorVariable(varMap, styleKey);
  if (styleKey && variable) {
    stroke = figma.variables.setBoundVariableForPaint(stroke as SolidPaint, 'color', variable);
  } else if (styleKey && styleMap?.color[styleKey]) {
    const id = styleMap.color[styleKey];
    if ('setStrokeStyleIdAsync' in node) {
      try {
        await (node as any).setStrokeStyleIdAsync(id);
      } catch {
        /* fallback */
      }
    }
  }
  node.strokes = [stroke];
  node.strokeWeight = weight;
}

export async function setEffect(
  node: MinimalEffects,
  shadow: { x: number; y: number; blur: number; spread: number; color: string } | undefined,
  styleKey?: string,
  styleMap?: StyleMap,
  _varMap?: VariableMap
): Promise<void> {
  if (!shadow) return;
  const rgba = parseRgba(shadow.color);
  node.effects = [
    {
      type: 'DROP_SHADOW',
      offset: { x: shadow.x, y: shadow.y },
      radius: shadow.blur,
      spread: shadow.spread,
      color: rgba,
      visible: true,
      blendMode: 'NORMAL',
    },
  ];
  if (styleKey && styleMap?.effect[styleKey]) {
    const id = styleMap.effect[styleKey];
    if ('setEffectStyleIdAsync' in node) {
      try {
        await (node as any).setEffectStyleIdAsync(id);
      } catch {
        /* fallback */
      }
    }
  }
}

export interface TextOptions {
  characters: string;
  fontFamily?: string;
  weight?: number;
  fontSize?: number;
  fill?: string;
  align?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  valign?: 'TOP' | 'CENTER' | 'BOTTOM';
  lineHeightRatio?: number;
  letterSpacing?: number;
  styleKey?: string;
  styleMap?: StyleMap;
  truncate?: boolean;
}

export function text(opts: TextOptions): TextNode {
  const t = figma.createText();
  t.name = opts.characters || 'text';
  t.fontName = resolveFont(opts.fontFamily ?? 'Google Sans', opts.weight ?? 400);
  t.fontSize = opts.fontSize ?? 14;
  t.characters = opts.characters;
  t.fills = [{ type: 'SOLID', color: hexToRgb(opts.fill ?? '#0F172A') }];
  t.textAutoResize = 'WIDTH_AND_HEIGHT';
  t.textAlignHorizontal = opts.align ?? 'LEFT';
  t.textAlignVertical = opts.valign ?? 'CENTER';
  if (opts.lineHeightRatio) {
    t.lineHeight = { value: (opts.fontSize ?? 14) * opts.lineHeightRatio, unit: 'PIXELS' };
  }
  t.letterSpacing = { value: opts.letterSpacing ?? -5, unit: 'PERCENT' };
  if (opts.styleKey && opts.styleMap?.text[opts.styleKey]) {
    t.textStyleId = opts.styleMap.text[opts.styleKey];
  }
  return t;
}

export function rect(name: string, w: number, h: number, hex?: string): RectangleNode {
  const r = figma.createRectangle();
  r.name = name;
  r.resize(w, h);
  if (hex) r.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];
  return r;
}

export function ellipse(name: string, d: number, hex?: string): EllipseNode {
  const e = figma.createEllipse();
  e.name = name;
  e.resize(d, d);
  if (hex) e.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];
  return e;
}

export function line(length: number, hex = '#CBD5E1', weight = 1): LineNode {
  const l = figma.createLine();
  l.name = 'divider';
  l.resize(length, 0);
  l.strokes = [{ type: 'SOLID', color: hexToRgb(hex) }];
  l.strokeWeight = weight;
  return l;
}

export function hbox(name = 'row'): FrameNode {
  const f = makeFrame(name);
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'MIN';
  f.counterAxisAlignItems = 'CENTER';
  f.itemSpacing = 8;
  return f;
}

export function vbox(name = 'col'): FrameNode {
  const f = makeFrame(name);
  f.layoutMode = 'VERTICAL';
  f.primaryAxisAlignItems = 'MIN';
  f.counterAxisAlignItems = 'MIN';
  f.itemSpacing = 8;
  return f;
}

export function pad(
  node: FrameNode | ComponentNode,
  top: number,
  right?: number,
  bottom?: number,
  left?: number
): void {
  node.paddingTop = top;
  node.paddingRight = right ?? top;
  node.paddingBottom = bottom ?? top;
  node.paddingLeft = left ?? right ?? top;
}

// ---- minimal structural types (avoid importing the huge Figma union) ----

export interface MinimalFills {
  fills: ReadonlyArray<Paint> | symbol;
  fillStyleId?: string | symbol;
}
export interface MinimalStrokes {
  strokes: ReadonlyArray<Paint> | symbol;
  strokeWeight: number | symbol;
  strokeStyleId?: string | symbol;
}
export interface MinimalEffects {
  effects: ReadonlyArray<Effect> | symbol;
  effectStyleId?: string | symbol;
}

function parseRgba(input: string): RGBA {
  const m = input.match(/rgba?\(([^)]+)\)/);
  if (!m) return { r: 0, g: 0, b: 0, a: 0.1 };
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  const [r, g, b, a = 0.1] = parts;
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a,
  };
}
