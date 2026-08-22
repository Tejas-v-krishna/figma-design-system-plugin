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
  t.fontName = resolveFont(opts.fontFamily ?? 'Inter', opts.weight ?? 400);
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
function parseRgba(input: string): RGBA {
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
