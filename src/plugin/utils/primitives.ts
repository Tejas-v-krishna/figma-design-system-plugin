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
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  return f;
}

export function makeComponent(name: string): ComponentNode {
  const c = figma.createComponent();
  c.name = name;
  c.fills = [];
  c.primaryAxisSizingMode = 'AUTO';
  c.counterAxisSizingMode = 'AUTO';
  return c;
}

export const ICON_PATHS: Record<string, string> = {
  search: 'M21 21l-4.35-4.35M19 11a8 8 0 11-16 0 8 8 0 0116 0z',
  chevronDown: 'M6 9l6 6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronUp: 'M18 15l-6-6-6 6',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  alertCircle: 'M12 8v4m0 4h.01M22 12A10 10 0 112 12a10 10 0 0120 0z',
  alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01',
  info: 'M12 16v-4m0-4h.01M22 12A10 10 0 112 12a10 10 0 0120 0z',
  calendar: 'M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18',
  clock: 'M12 6v6l4 2M22 12A10 10 0 112 12a10 10 0 0120 0z',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  image: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  lock: 'M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
  externalLink: 'M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3',
};

export function createVectorIcon(
  name: string,
  size = 18,
  colorHex = '#64748B',
  strokeWidth = 2
): VectorNode {
  const v = figma.createVector();
  v.name = `icon-${name}`;
  const pathData = ICON_PATHS[name] ?? ICON_PATHS.info ?? 'M0 0h24v24H0z';
  v.vectorPaths = [{ windingRule: 'NONZERO', data: pathData }];
  v.strokes = [{ type: 'SOLID', color: hexToRgb(colorHex) }];
  v.strokeWeight = strokeWidth;
  v.strokeCap = 'ROUND';
  v.strokeJoin = 'ROUND';
  v.fills = [];
  v.resize(size, size);
  return v;
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

// ---- deferred style bindings ---------------------------------------------
//
// Binding a paint or effect style is asynchronous in a dynamic-page document
// (setFillStyleIdAsync and friends), but the several hundred call sites that
// paint a node are synchronous builders that construct and return it. Making
// them async would ripple through the entire component factory, and until now
// none of them awaited these functions at all — all 75 calls dropped the
// promise, so a rejection inside one became an unhandled rejection that Figma
// reports nowhere.
//
// So the paint is applied synchronously and the style binding is queued here.
// Commands call flushStyleBindings() before they report success, which means
// the work is finished before the sandbox tears down rather than racing it.

const pendingBindings: Promise<void>[] = [];

function queueBinding(p: Promise<unknown>): void {
  // Failures are absorbed on purpose. A style id that no longer resolves —
  // the user deleted the style between runs — should leave the raw paint that
  // was already applied in place, not abort a build of hundreds of nodes.
  pendingBindings.push(
    p.then(
      () => undefined,
      () => undefined
    )
  );
}

/**
 * Await every style binding queued so far.
 *
 * Loops because a flush can, in principle, run while more nodes are still being
 * built; splicing the queue each pass means late arrivals are picked up instead
 * of being silently left behind. Safe to call repeatedly.
 */
export async function flushStyleBindings(): Promise<void> {
  while (pendingBindings.length > 0) {
    await Promise.all(pendingBindings.splice(0, pendingBindings.length));
  }
}

/** How many bindings are still in flight. Used by tests and diagnostics. */
export function pendingStyleBindingCount(): number {
  return pendingBindings.length;
}

interface FillStyleBindable {
  setFillStyleIdAsync(id: string): Promise<void>;
}
interface StrokeStyleBindable {
  setStrokeStyleIdAsync(id: string): Promise<void>;
}
interface EffectStyleBindable {
  setEffectStyleIdAsync(id: string): Promise<void>;
}

function canBindFillStyle(node: MinimalFills): node is MinimalFills & FillStyleBindable {
  return typeof (node as Partial<FillStyleBindable>).setFillStyleIdAsync === 'function';
}
function canBindStrokeStyle(node: MinimalStrokes): node is MinimalStrokes & StrokeStyleBindable {
  return typeof (node as Partial<StrokeStyleBindable>).setStrokeStyleIdAsync === 'function';
}
function canBindEffectStyle(node: MinimalEffects): node is MinimalEffects & EffectStyleBindable {
  return typeof (node as Partial<EffectStyleBindable>).setEffectStyleIdAsync === 'function';
}

/** Apply a solid fill, optionally binding a Paint Style or Variable by key. */
export function setFill(
  node: MinimalFills,
  hex: string,
  styleKey?: string,
  styleMap?: StyleMap,
  varMap?: VariableMap
): void {
  const variable = resolveColorVariable(varMap, styleKey);
  let fill: Paint = { type: 'SOLID', color: hexToRgb(hex) };

  // A bound variable lives inside the paint, so this path is complete once the
  // fill is assigned — and it takes precedence, since a variable carries mode
  // information a style cannot.
  if (styleKey && variable) {
    fill = figma.variables.setBoundVariableForPaint(fill as SolidPaint, 'color', variable);
    node.fills = [fill];
    return;
  }

  // Paint first, style second. Assigning `fills` detaches whatever style is
  // applied to the node, so the previous order — bind the style, then assign
  // the paint — threw away the binding it had just made. With variables turned
  // off, that meant every generated component carried a raw hex fill instead of
  // a link to the colour style, which is the whole point of generating styles.
  // The paint is still assigned unconditionally so a binding that fails leaves
  // the correct colour behind rather than Figma's default grey.
  node.fills = [fill];
  const id = styleKey ? styleMap?.color[styleKey] : undefined;
  if (id && canBindFillStyle(node)) queueBinding(node.setFillStyleIdAsync(id));
}

export function setStroke(
  node: MinimalStrokes,
  hex: string,
  weight = 1,
  styleKey?: string,
  styleMap?: StyleMap,
  varMap?: VariableMap
): void {
  const variable = resolveColorVariable(varMap, styleKey);
  let stroke: Paint = { type: 'SOLID', color: hexToRgb(hex) };

  node.strokeWeight = weight;

  if (styleKey && variable) {
    stroke = figma.variables.setBoundVariableForPaint(stroke as SolidPaint, 'color', variable);
    node.strokes = [stroke];
    return;
  }

  // Same ordering fix as setFill: assigning `strokes` detaches the stroke style.
  node.strokes = [stroke];
  const id = styleKey ? styleMap?.color[styleKey] : undefined;
  if (id && canBindStrokeStyle(node)) queueBinding(node.setStrokeStyleIdAsync(id));
}

export function setEffect(
  node: MinimalEffects,
  shadow: { x: number; y: number; blur: number; spread: number; color: string } | undefined,
  styleKey?: string,
  styleMap?: StyleMap,
  _varMap?: VariableMap
): void {
  if (!shadow) return;
  node.effects = [
    {
      type: 'DROP_SHADOW',
      offset: { x: shadow.x, y: shadow.y },
      radius: shadow.blur,
      spread: shadow.spread,
      color: parseRgba(shadow.color),
      visible: true,
      blendMode: 'NORMAL',
    },
  ];
  const id = styleKey ? styleMap?.effect[styleKey] : undefined;
  if (id && canBindEffectStyle(node)) queueBinding(node.setEffectStyleIdAsync(id));
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
  t.letterSpacing = { value: opts.letterSpacing ?? 0, unit: 'PERCENT' };
  // The sync `textStyleId` setter is read-only when the manifest declares
  // documentAccess: "dynamic-page" — assigning it throws "Cannot write to
  // internal and read-only node property". It was assigned here, so every text
  // node that had a style key threw, which is every heading and label once
  // "create styles" is on. Same deferred queue as the paint bindings.
  const textStyleId = opts.styleKey ? opts.styleMap?.text[opts.styleKey] : undefined;
  if (textStyleId) queueBinding(t.setTextStyleIdAsync(textStyleId));
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

/**
 * Parse an `rgb()` / `rgba()` string into a Figma RGBA.
 *
 * Everything is bounds-checked because the input is a token value that may have
 * come from an imported file, and Figma rejects a paint containing NaN with an
 * opaque error thrown from inside the API rather than from the caller. A
 * malformed component degrades to a visible near-black shadow instead.
 */
export function parseRgba(input: string): RGBA {
  const fallback: RGBA = { r: 0, g: 0, b: 0, a: 0.1 };
  const m = /rgba?\(([^)]+)\)/.exec(input);
  const body = m?.[1];
  if (!body) return fallback;

  const parts = body.split(',').map((p) => parseFloat(p.trim()));
  const channel = (n: number | undefined) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.min(1, Math.max(0, n / 255)) : 0;
  const alpha = parts[3];

  return {
    r: channel(parts[0]),
    g: channel(parts[1]),
    b: channel(parts[2]),
    a: typeof alpha === 'number' && Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : 0.1,
  };
}
