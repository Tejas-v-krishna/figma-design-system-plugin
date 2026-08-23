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
  showcaseType?: 'variant' | 'size' | 'state' | 'icon';
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
  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22 6 12 13 2 6"></polyline></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  eyeOff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  file: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
  arrowUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`,
  arrowUpRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"></line><polyline points="7 7 17 7 17 17"></polyline></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`,
  code: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  terminal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  dollar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
  trendingUp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
  trendingDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>`,
  moreHorizontal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`,
  moreVertical: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>`,
  google: `<svg viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.7 7.3 9.1 5 12 5z"/><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.3-4.7 3.3-8.1z"/><path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5L2.2 17C4 20.5 7.7 23 12 23z"/></svg>`,
  apple: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.77 1.06-1.84.94-2.91-.91.04-2.02.61-2.67 1.38-.58.68-1.09 1.77-.95 2.83 1.02.08 2.05-.53 2.68-1.3z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  microsoft: `<svg viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>`,
  alertCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
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
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isFocused = sKey === 'focused' || sKey === 'focus';
  const isDisabled = sKey === 'disabled';

  const isSecondary = vKey === 'secondary';
  const isOutline = vKey === 'outline' || vKey === 'brand' || vKey === 'bordered';
  const isGhost = vKey === 'ghost';
  const isDestructive = vKey === 'destructive' || vKey === 'danger';
  const isTonal = vKey === 'tonal' || vKey === 'soft' || vKey === 'tertiary';
  const isLink = vKey === 'link';
  const isPrimary = !isSecondary && !isOutline && !isGhost && !isDestructive && !isTonal && !isLink;

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.cornerRadius = 9999;
  root.strokes = [];
  root.effects = [];

  const isSizeShowcase = ctx.showcaseType === 'size';
  const isIconShowcase = ctx.showcaseType === 'icon' || Boolean(ctx.variantProps.iconType);

  // Sizing
  const szKey = String(ctx.sizeName || ctx.sizeProps.name || 'md').toLowerCase();
  let height = 40;
  let padX = 20;
  let fontSize = 14;
  let iconSize = 15;

  if (szKey === 'xs') {
    height = 28;
    padX = 12;
    fontSize = 11;
    iconSize = 12;
  } else if (szKey === 'sm') {
    height = 34;
    padX = 16;
    fontSize = 12;
    iconSize = 13;
  } else if (szKey === 'lg') {
    height = 48;
    padX = 26;
    fontSize = 15;
    iconSize = 17;
  } else if (szKey === 'xl') {
    height = 56;
    padX = 32;
    fontSize = 16;
    iconSize = 18;
  }

  if (isSizeShowcase || isIconShowcase || isLink) {
    root.primaryAxisSizingMode = 'AUTO';
    root.counterAxisSizingMode = 'AUTO';
    pad(root, Math.max(6, Math.round((height - fontSize) / 2) - 1), padX);
    root.itemSpacing = 8;
  } else {
    root.primaryAxisSizingMode = 'FIXED';
    root.counterAxisSizingMode = 'FIXED';
    root.resize(108, 40);
    root.itemSpacing = 8;
  }

  let textHex = '#FFFFFF';

  if (isPrimary) {
    if (isDisabled) {
      setFill(root, '#8E8E93');
      textHex = '#FFFFFF';
    } else if (isHover) {
      setFill(root, '#27272A');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.22 },
        offset: { x: 0, y: 3 },
        radius: 6,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocused) {
      setFill(root, '#18181B');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.12 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 4,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#18181B');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.16 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isOutline) {
    if (isDisabled) {
      root.fills = [];
      setStroke(root, '#E4E4E7', 1.5);
      textHex = '#A1A1AA';
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      setStroke(root, '#18181B', 1.5);
      textHex = '#18181B';
    } else if (isFocused) {
      setFill(root, '#FFFFFF');
      setStroke(root, '#18181B', 2);
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 3,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      root.fills = [];
      setStroke(root, '#18181B', 1.5);
      textHex = '#18181B';
    }
  } else if (isSecondary) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      setStroke(root, '#E4E4E7', 1);
      textHex = '#A1A1AA';
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      setStroke(root, '#D4D4D8', 1);
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 2 },
        radius: 5,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocused) {
      setFill(root, '#FFFFFF');
      setStroke(root, '#D4D4D8', 1);
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.06 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 4,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#FFFFFF');
      setStroke(root, '#E4E4E7', 1);
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isTonal) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      textHex = '#A1A1AA';
    } else if (isHover) {
      setFill(root, '#E4E4E7');
      textHex = '#18181B';
    } else if (isFocused) {
      setFill(root, '#F4F4F5');
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 4,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#F4F4F5');
      textHex = '#18181B';
    }
  } else if (isGhost) {
    if (isDisabled) {
      root.fills = [];
      textHex = '#A1A1AA';
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      textHex = '#18181B';
    } else if (isFocused) {
      setFill(root, '#FFFFFF');
      setStroke(root, '#E4E4E7', 1);
      textHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.06 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 4,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      root.fills = [];
      textHex = '#18181B';
    }
  } else if (isDestructive) {
    if (isDisabled) {
      setFill(root, '#FCA5A5');
      textHex = '#FFFFFF';
    } else if (isHover) {
      setFill(root, '#C93030');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.79, g: 0.19, b: 0.19, a: 0.3 },
        offset: { x: 0, y: 3 },
        radius: 6,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isFocused) {
      setFill(root, '#E03E3E');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.88, g: 0.24, b: 0.24, a: 0.28 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 4,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#E03E3E');
      textHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.88, g: 0.24, b: 0.24, a: 0.25 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isLink) {
    root.fills = [];
    textHex = '#18181B';
  }

  // Icons & Contextual items
  const iconType = ctx.variantProps.iconType ? String(ctx.variantProps.iconType) : '';

  if (iconType === 'leading') {
    root.appendChild(buildIcon(iconSize, textHex, 'plus'));
  } else if (iconType === 'copy') {
    root.appendChild(buildIcon(iconSize, textHex, 'copy'));
  } else if (iconType === 'copied') {
    root.appendChild(buildIcon(iconSize, textHex, 'check'));
  } else if (iconType === 'badge') {
    root.appendChild(buildIcon(iconSize, textHex, 'star'));
  } else if (iconType === 'loading') {
    const spinner = ellipse('spinnerRing', iconSize);
    spinner.fills = [];
    spinner.strokes = [{ type: 'SOLID', color: hexToRgbSafe(textHex) }];
    spinner.strokeWeight = 2;
    root.appendChild(spinner);
  }

  let btnLabel = ctx.stateName || 'Button';
  if (isSizeShowcase) {
    btnLabel = `Button (${szKey.toUpperCase()})`;
  } else if (ctx.variantProps.customLabel) {
    btnLabel = String(ctx.variantProps.customLabel);
  }

  const label = text({
    characters: btnLabel,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize,
    fill: textHex,
  });
  root.appendChild(label);

  if (iconType === 'trailing') {
    root.appendChild(buildIcon(iconSize, textHex, 'arrowRight'));
  } else if (iconType === 'external') {
    root.appendChild(buildIcon(iconSize, textHex, 'arrowUpRight'));
  } else if (iconType === 'badge') {
    const badge = figma.createFrame();
    badge.name = 'badge';
    badge.layoutMode = 'HORIZONTAL';
    badge.primaryAxisSizingMode = 'AUTO';
    badge.counterAxisSizingMode = 'AUTO';
    badge.primaryAxisAlignItems = 'CENTER';
    badge.counterAxisAlignItems = 'CENTER';
    badge.cornerRadius = 9999;
    pad(badge, 2, 7);
    badge.fills = [{ type: 'SOLID', color: hexToRgbSafe(isSecondary ? '#F1F5F9' : '#323236') }];
    badge.appendChild(text({
      characters: '1.2k',
      fontFamily: ctx.config.fontFamily.body,
      weight: 600,
      fontSize: Math.max(10, fontSize - 2),
      fill: isSecondary ? '#64748B' : '#FFFFFF',
    }));
    root.appendChild(badge);
  }

  return root;
};

const IconButton: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isFocused = sKey === 'focused' || sKey === 'focus';
  const isDisabled = sKey === 'disabled';

  const isSecondary = vKey === 'secondary';
  const isOutline = vKey === 'outline' || vKey === 'obsidian' || vKey === 'bordered';
  const isGhost = vKey === 'ghost';

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 0);
  const iconBtnSize = ctx.sizeName === 'sm' ? 32 : ctx.sizeName === 'lg' ? 48 : 40;
  root.resize(iconBtnSize, iconBtnSize);
  root.cornerRadius = 9999;
  root.strokes = [];
  root.effects = [];

  let fgHex = '#FFFFFF';

  if (isOutline) {
    if (isActive) setFill(root, '#E4E4E7');
    else if (isHover) setFill(root, '#F4F4F5');
    else root.fills = [];
    setStroke(root, isDisabled ? '#E4E4E7' : '#18181B', 1.5);
    fgHex = isDisabled ? '#A1A1AA' : '#18181B';
  } else if (isGhost) {
    if (isActive) setFill(root, colorShade(ctx.tokens, 'neutral', 200));
    else if (isHover) setFill(root, colorShade(ctx.tokens, 'neutral', 100));
    else root.fills = [];
    fgHex = colorShade(ctx.tokens, 'neutral', 700);
  } else if (isSecondary) {
    if (isActive) setFill(root, colorShade(ctx.tokens, 'neutral', 100));
    else if (isHover) setFill(root, colorShade(ctx.tokens, 'neutral', 50));
    else setFill(root, '#FFFFFF');
    setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
    fgHex = colorShade(ctx.tokens, 'neutral', 800);
    root.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.04 },
      offset: { x: 0, y: 1 },
      radius: 2,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
  } else {
    if (isActive) setFill(root, '#09090B');
    else if (isHover) setFill(root, '#27272A');
    else setFill(root, '#18181B');
    fgHex = '#FFFFFF';
    root.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: 0.18 },
      offset: { x: 0, y: 2 },
      radius: 4,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
  }

  if (isFocused) {
    root.effects = [
      ...(root.effects || []),
      {
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.15 },
        offset: { x: 0, y: 0 },
        radius: 0,
        spread: 3,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
  }

  root.opacity = isDisabled ? 0.5 : 1;
  root.appendChild(buildIcon(ctx.sizeName === 'sm' ? 14 : ctx.sizeName === 'lg' ? 18 : 16, fgHex, 'plus'));

  return root;
};

const ButtonGroup: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const szHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 32 : 40));
  const padY = szHeight <= 32 ? 4 : 6;
  const padX = szHeight <= 32 ? 10 : 14;
  const fontSize = szHeight <= 32 ? 11 : 13;

  const isSegmented = vKey.includes('segmented');
  const isConnected = vKey.includes('connected');
  const isPill = ctx.config.radiusPreset === 'pill';
  const baseRadius = isPill ? 9999 : radiusPx(ctx.tokens, 'md');

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';

  if (isSegmented) {
    // Segmented: Enclosed tray container with subtle background
    root.itemSpacing = 2;
    root.cornerRadius = baseRadius;
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
      pad(b, padY, padX);
      b.cornerRadius = isPill ? 9999 : Math.max(2, baseRadius - 2);
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
        fontSize,
        fill: selected ? colorShade(ctx.tokens, 'neutral', 900) : colorShade(ctx.tokens, 'neutral', 600),
      }));
      root.appendChild(b);
    }
  } else if (isConnected) {
    // Connected: Joined buttons with shared borders
    root.itemSpacing = 0;
    root.cornerRadius = baseRadius;
    root.fills = [];

    for (const [i, label] of SEGMENT_LABELS.entries()) {
      const b = figma.createFrame();
      b.name = `item-${i}`;
      b.layoutMode = 'HORIZONTAL';
      b.primaryAxisSizingMode = 'AUTO';
      b.counterAxisSizingMode = 'AUTO';
      b.primaryAxisAlignItems = 'CENTER';
      b.counterAxisAlignItems = 'CENTER';
      pad(b, padY + 2, padX + 2);

      if (i === 0) {
        b.topLeftRadius = baseRadius;
        b.bottomLeftRadius = baseRadius;
        b.topRightRadius = 0;
        b.bottomRightRadius = 0;
      } else if (i === SEGMENT_LABELS.length - 1) {
        b.topLeftRadius = 0;
        b.bottomLeftRadius = 0;
        b.topRightRadius = baseRadius;
        b.bottomRightRadius = baseRadius;
      } else {
        b.cornerRadius = 0;
      }

      const selected = i === 1;
      if (selected) {
        setFill(b, '#18181B');
        setStroke(b, '#18181B', 1);
      } else {
        setFill(b, '#FFFFFF');
        setStroke(b, colorShade(ctx.tokens, 'neutral', 300), 1, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
      }

      b.appendChild(text({
        characters: label,
        fontFamily: ctx.config.fontFamily.body,
        weight: selected ? 600 : 500,
        fontSize,
        fill: selected ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 700),
      }));
      root.appendChild(b);
    }
  } else {
    // Default: Individual discrete buttons with gaps
    root.itemSpacing = 6;
    root.fills = [];

    for (const [i, label] of SEGMENT_LABELS.entries()) {
      const b = figma.createFrame();
      b.name = `item-${i}`;
      b.layoutMode = 'HORIZONTAL';
      b.primaryAxisSizingMode = 'AUTO';
      b.counterAxisSizingMode = 'AUTO';
      b.primaryAxisAlignItems = 'CENTER';
      b.counterAxisAlignItems = 'CENTER';
      pad(b, padY + 2, padX + 2);
      b.cornerRadius = baseRadius;

      const selected = i === 1;
      if (selected) {
        setFill(b, '#18181B');
      } else {
        setFill(b, '#FFFFFF');
        setStroke(b, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);
      }

      b.appendChild(text({
        characters: label,
        fontFamily: ctx.config.fontFamily.body,
        weight: selected ? 600 : 500,
        fontSize,
        fill: selected ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 700),
      }));
      root.appendChild(b);
    }
  }

  return root;
};

const Input: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const fieldHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 36 : ctx.sizeName === 'lg' ? 52 : 44));
  const fieldWidth = ctx.showcaseType === 'size' ? 240 : 176;
  const fontSize = Number(ctx.sizeProps.fontSize ?? (fieldHeight <= 36 ? 12 : fieldHeight >= 50 ? 15 : 13));
  const padX = fieldHeight <= 36 ? 12 : fieldHeight >= 50 ? 16 : 14;
  const iconSz = fieldHeight <= 36 ? 14 : fieldHeight >= 50 ? 18 : 16;
  const isPill = ctx.config.radiusPreset === 'pill';
  const isSharp = ctx.config.radiusPreset === 'sharp';

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'FIXED';
  root.counterAxisSizingMode = 'FIXED';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  pad(root, 0, padX);
  root.resize(fieldWidth, fieldHeight);
  root.cornerRadius = isPill ? 9999 : isSharp ? 0 : 10;
  root.clipsContent = true;
  root.strokes = [];
  root.effects = [];

  const isSuccess = sKey === 'success' || sKey === 'valid';
  const isError = sKey === 'error' || sKey === 'invalid';
  const isFocus = sKey === 'focus' || sKey === 'focused';
  const isHover = sKey === 'hover';
  const isDisabled = sKey === 'disabled';

  let bg = '#F1F3F5';
  let textFill = '#18181B';
  let placeholderFill = '#71717A';

  if (isDisabled) {
    bg = '#F8FAFC';
    textFill = '#A1A1AA';
    placeholderFill = '#A1A1AA';
    root.opacity = 0.6;
  } else if (isSuccess) {
    bg = '#E8F8EE';
    textFill = '#18181B';
  } else if (isError) {
    bg = '#FEEAEA';
    textFill = '#18181B';
  } else if (isFocus) {
    bg = '#EEF2FF';
    textFill = '#18181B';
  } else if (isHover) {
    bg = '#E8EAED';
    textFill = '#18181B';
  }

  setFill(root, bg);

  // Left Content Frame
  const leftBox = makeFrame('leftContent');
  leftBox.layoutMode = 'HORIZONTAL';
  leftBox.counterAxisAlignItems = 'CENTER';
  leftBox.itemSpacing = 8;
  leftBox.fills = [];

  if (vKey.includes('country')) {
    leftBox.appendChild(buildIcon(iconSz, isError ? '#EF4444' : isSuccess ? '#16A34A' : '#71717A', 'globe'));
  } else if (vKey.includes('email')) {
    leftBox.appendChild(buildIcon(iconSz, isError ? '#EF4444' : isSuccess ? '#16A34A' : '#71717A', 'mail'));
  } else if (vKey.includes('search') || vKey.includes('withicon')) {
    leftBox.appendChild(buildIcon(iconSz, isError ? '#EF4444' : isSuccess ? '#16A34A' : '#71717A', 'search'));
  }

  let labelStr = 'Default input';
  let isPlaceholder = false;

  if (vKey.includes('dropdown')) {
    labelStr = isSuccess ? 'MIT License' : 'Select license';
  } else if (vKey.includes('country')) {
    labelStr = isError ? 'Unknown country' : 'United States';
  } else if (vKey.includes('email')) {
    labelStr = isError ? 'invalid-email' : isFocus ? 'alex@|' : 'alex@domain.com';
  } else if (vKey.includes('search') || vKey.includes('withicon')) {
    labelStr = isSuccess ? 'Design System' : isFocus ? 'Search query|' : 'Search components…';
    if (!isSuccess && !isFocus) isPlaceholder = true;
  } else {
    // Text / Default
    if (isSuccess) labelStr = 'Confirmed input';
    else if (isFocus) labelStr = 'Roman Kamushken|';
    else if (isError) labelStr = 'Roman Kamushken';
    else labelStr = 'Default input';
  }

  if (ctx.showcaseType === 'size') {
    labelStr = `Sample (${fieldHeight}px)`;
    isPlaceholder = true;
  }

  leftBox.appendChild(text({
    characters: labelStr,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize,
    fill: isPlaceholder ? placeholderFill : textFill,
  }));

  root.appendChild(leftBox);

  // Right Trailing Icon (Status or Chevron)
  if (isSuccess) {
    root.appendChild(buildIcon(16, '#16A34A', 'check'));
  } else if (isError) {
    root.appendChild(buildIcon(16, '#EF4444', 'alertCircle'));
  } else if (vKey.includes('dropdown') || vKey.includes('country')) {
    root.appendChild(buildIcon(14, '#71717A', 'chevronDown'));
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
  ring.cornerRadius = 9999;
  setFill(ring, '#FFFFFF');

  if (isDisabled) {
    setStroke(ring, colorShade(ctx.tokens, 'neutral', 300), 1.5, colorStyleKey('neutral', 300), ctx.styleMap, ctx.varMap);
    root.opacity = 0.5;
  } else if (isChecked) {
    setStroke(ring, colorShade(ctx.tokens, 'primary', 500), 2, colorStyleKey('primary', 500), ctx.styleMap, ctx.varMap);
    const dot = ellipse('dot', Math.round(d * 0.5), colorShade(ctx.tokens, 'primary', 500));
    ring.appendChild(dot);
  } else {
    setStroke(ring, colorShade(ctx.tokens, 'neutral', 400), 1.5, colorStyleKey('neutral', 400), ctx.styleMap, ctx.varMap);
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
  track.primaryAxisAlignItems = on ? 'MAX' : 'MIN';
  track.resize(w, h);
  pad(track, 3, 3);
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

  const bar = hbox('bar');
  bar.resize(220, 20);
  bar.itemSpacing = 0;
  bar.counterAxisAlignItems = 'CENTER';

  const fill = rect('fillTrack', 110, 6, colorShade(ctx.tokens, 'primary', 500));
  fill.cornerRadius = 9999;
  const knob = ellipse('knob', 16, '#FFFFFF');
  setStroke(knob, colorShade(ctx.tokens, 'primary', 500), 2);
  const empty = rect('emptyTrack', 94, 6, colorShade(ctx.tokens, 'neutral', 200));
  empty.cornerRadius = 9999;

  bar.appendChild(fill);
  bar.appendChild(knob);
  bar.appendChild(empty);

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
    a.cornerRadius = 9999;
    setFill(a, colorShade(ctx.tokens, member.tone, 400));
    setStroke(a, '#FFFFFF', 2);
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
      tab.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? '#18181B' : colorShade(ctx.tokens, 'neutral', 600) }));
      if (active) {
        const bar = rect('indicator', 60, 2, '#18181B');
        tab.appendChild(bar);
      }
    } else {
      pad(tab, 8, 14);
      tab.cornerRadius = containerRadius(ctx, 'sm', 6);
      setFill(tab, active ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 100), active ? undefined : colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
      if (active) setEffect(tab, shadow(ctx.tokens, 'xs'), effectStyleKey('xs'), ctx.styleMap, ctx.varMap);
      tab.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: active ? 600 : 400, fontSize: 14, fill: active ? '#18181B' : colorShade(ctx.tokens, 'neutral', 600) }));
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
    if (active) {
      setFill(cell, '#18181B');
    } else {
      setFill(cell, '#FFFFFF');
      setStroke(cell, colorShade(ctx.tokens, 'neutral', 200), 1);
    }
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
    dot.cornerRadius = 9999;
    setFill(dot, i <= 1 ? '#18181B' : colorShade(ctx.tokens, 'neutral', 200));
    dot.appendChild(text({ characters: String(i + 1), fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: i <= 1 ? '#FFFFFF' : colorShade(ctx.tokens, 'neutral', 500), align: 'CENTER' }));
    root.appendChild(dot);
    if (i < 2) {
      const conn = rect(`conn-${i}`, 40, 2, i === 0 ? '#18181B' : colorShade(ctx.tokens, 'neutral', 200));
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



const SegmentedControl: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const szHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 32 : ctx.sizeName === 'lg' ? 44 : 38));
  const padY = szHeight <= 32 ? 3 : szHeight >= 44 ? 7 : 5;
  const padX = szHeight <= 32 ? 8 : szHeight >= 44 ? 18 : 12;
  const fontSize = szHeight <= 32 ? 11 : szHeight >= 44 ? 13 : 12;

  const isRounded = vKey.includes('rounded');
  const isBlock = vKey.includes('block');
  const trackRadius = isBlock ? 4 : isRounded ? 8 : 9999;
  const itemRadius = isBlock ? 2 : isRounded ? 6 : 9999;

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 2;
  root.cornerRadius = trackRadius;
  pad(root, 3, 3);
  setFill(root, colorShade(ctx.tokens, 'neutral', 100), colorStyleKey('neutral', 100), ctx.styleMap, ctx.varMap);
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1, colorStyleKey('neutral', 200), ctx.styleMap, ctx.varMap);

  ['Overview', 'Analytics', 'Reports'].forEach((label, i) => {
    const item = figma.createFrame();
    item.name = `seg-${i}`;
    item.layoutMode = 'HORIZONTAL';
    item.primaryAxisSizingMode = 'AUTO';
    item.counterAxisSizingMode = 'AUTO';
    item.primaryAxisAlignItems = 'CENTER';
    item.counterAxisAlignItems = 'CENTER';
    pad(item, padY, padX);
    item.cornerRadius = itemRadius;
    const isSel = i === 0;
    if (isSel) {
      setFill(item, '#FFFFFF');
      item.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      item.fills = [];
    }
    item.appendChild(text({
      characters: label,
      fontFamily: ctx.config.fontFamily.body,
      weight: isSel ? 600 : 500,
      fontSize,
      fill: isSel ? '#18181B' : colorShade(ctx.tokens, 'neutral', 600),
    }));
    root.appendChild(item);
  });
  return root;
};

const SplitButton: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isDisabled = sKey === 'disabled';

  const isSecondary = vKey.includes('secondary');
  const isTonal = vKey.includes('tonal');
  const isDestructive = vKey.includes('destructive') || vKey.includes('danger');
  const isOutline = vKey.includes('outline');

  const szHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 32 : ctx.sizeName === 'lg' ? 48 : 40));
  const padY = szHeight <= 32 ? 4 : szHeight >= 48 ? 10 : 8;
  const padMainX = szHeight <= 32 ? 10 : szHeight >= 48 ? 18 : 14;
  const padDropX = szHeight <= 32 ? 6 : szHeight >= 48 ? 10 : 8;
  const fontSize = szHeight <= 32 ? 11 : szHeight >= 48 ? 14 : 13;
  const iconSz = szHeight <= 32 ? 12 : szHeight >= 48 ? 15 : 13;

  const isPill = ctx.config.radiusPreset === 'pill';
  const radius = isPill ? 9999 : radiusPx(ctx.tokens, 'md');

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.counterAxisAlignItems = 'CENTER';
  root.cornerRadius = radius;
  root.strokes = [];
  root.effects = [];

  let textFill = '#FFFFFF';
  let sepColor = '#FFFFFF';

  if (isDestructive) {
    if (isDisabled) {
      setFill(root, '#FCA5A5');
      textFill = '#FFFFFF';
      sepColor = '#FCA5A5';
    } else if (isActive) {
      setFill(root, '#991B1B');
      textFill = '#FFFFFF';
      sepColor = '#B91C1C';
    } else if (isHover) {
      setFill(root, '#B91C1C');
      textFill = '#FFFFFF';
      sepColor = '#DC2626';
    } else {
      setFill(root, '#DC2626');
      textFill = '#FFFFFF';
      sepColor = '#EF4444';
    }
  } else if (isTonal) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      textFill = '#A1A1AA';
      sepColor = '#E4E4E7';
    } else if (isActive) {
      setFill(root, '#D4D4D8');
      textFill = '#18181B';
      sepColor = '#CBD5E1';
    } else if (isHover) {
      setFill(root, '#E4E4E7');
      textFill = '#18181B';
      sepColor = '#D4D4D8';
    } else {
      setFill(root, '#F4F4F5');
      textFill = '#18181B';
      sepColor = '#E4E4E7';
    }
  } else if (isSecondary) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      setStroke(root, '#E4E4E7', 1);
      textFill = '#A1A1AA';
      sepColor = '#E4E4E7';
    } else if (isActive) {
      setFill(root, '#E4E4E7');
      setStroke(root, '#D4D4D8', 1);
      textFill = '#18181B';
      sepColor = '#D4D4D8';
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      setStroke(root, '#D4D4D8', 1);
      textFill = '#18181B';
      sepColor = '#D4D4D8';
    } else {
      setFill(root, '#FFFFFF');
      setStroke(root, '#E4E4E7', 1);
      textFill = '#18181B';
      sepColor = '#E4E4E7';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 1 },
        radius: 2,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isOutline) {
    if (isDisabled) {
      root.fills = [];
      setStroke(root, '#E4E4E7', 1.5);
      textFill = '#A1A1AA';
      sepColor = '#E4E4E7';
    } else if (isActive) {
      setFill(root, '#E4E4E7');
      setStroke(root, '#18181B', 1.5);
      textFill = '#18181B';
      sepColor = '#18181B';
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      setStroke(root, '#18181B', 1.5);
      textFill = '#18181B';
      sepColor = '#18181B';
    } else {
      root.fills = [];
      setStroke(root, '#18181B', 1.5);
      textFill = '#18181B';
      sepColor = '#18181B';
    }
  } else {
    // Primary Solid Obsidian
    if (isDisabled) {
      setFill(root, '#71717A');
      textFill = '#FFFFFF';
      sepColor = '#8E8E93';
    } else if (isActive) {
      setFill(root, '#09090B');
      textFill = '#FFFFFF';
      sepColor = '#27272A';
    } else if (isHover) {
      setFill(root, '#27272A');
      textFill = '#FFFFFF';
      sepColor = '#52525B';
    } else {
      setFill(root, '#18181B');
      textFill = '#FFFFFF';
      sepColor = '#3F3F46';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.16 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  }

  const mainBtn = makeFrame('mainBtn');
  mainBtn.layoutMode = 'HORIZONTAL';
  mainBtn.counterAxisAlignItems = 'CENTER';
  pad(mainBtn, padY, padMainX);
  mainBtn.fills = [];
  mainBtn.appendChild(text({ characters: 'Publish', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize, fill: textFill }));
  root.appendChild(mainBtn);

  const sep = rect('sep', 1, Math.max(14, szHeight - 16), sepColor);
  sep.opacity = isSecondary ? 1 : 0.4;
  root.appendChild(sep);

  const dropTrigger = makeFrame('dropTrigger');
  dropTrigger.layoutMode = 'HORIZONTAL';
  dropTrigger.primaryAxisAlignItems = 'CENTER';
  dropTrigger.counterAxisAlignItems = 'CENTER';
  pad(dropTrigger, padY, padDropX);
  dropTrigger.fills = [];
  dropTrigger.appendChild(buildIcon(iconSz, textFill, 'chevronDown'));
  root.appendChild(dropTrigger);

  return root;
};

const FloatingActionButton: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isDisabled = sKey === 'disabled';

  const isExtended = vKey.includes('extended');
  const isSurface = vKey.includes('surface') || vKey.includes('secondary');
  const isTonal = vKey.includes('tonal');

  const szKey = String(ctx.sizeName || ctx.sizeProps.name || 'md').toLowerCase();
  const dim = szKey === 'sm' ? 40 : szKey === 'lg' ? 56 : 48;
  const iconSz = szKey === 'sm' ? 16 : szKey === 'lg' ? 22 : 18;
  const fontSize = szKey === 'sm' ? 12 : szKey === 'lg' ? 15 : 14;
  const padY = szKey === 'sm' ? 8 : szKey === 'lg' ? 14 : 12;
  const padX = szKey === 'sm' ? 14 : szKey === 'lg' ? 22 : 18;

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.cornerRadius = 9999;
  root.strokes = [];
  root.effects = [];

  let fgHex = '#FFFFFF';

  if (isSurface) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      setStroke(root, '#E4E4E7', 1);
      fgHex = '#A1A1AA';
    } else if (isActive) {
      setFill(root, '#E4E4E7');
      setStroke(root, '#D4D4D8', 1);
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.06 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isHover) {
      setFill(root, '#F4F4F5');
      setStroke(root, '#D4D4D8', 1);
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.12 },
        offset: { x: 0, y: 6 },
        radius: 14,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#FFFFFF');
      setStroke(root, '#E4E4E7', 1);
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.08 },
        offset: { x: 0, y: 3 },
        radius: 8,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else if (isTonal) {
    if (isDisabled) {
      setFill(root, '#FAFAFA');
      fgHex = '#A1A1AA';
    } else if (isActive) {
      setFill(root, '#D4D4D8');
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.05 },
        offset: { x: 0, y: 1 },
        radius: 3,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isHover) {
      setFill(root, '#E4E4E7');
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.1 },
        offset: { x: 0, y: 5 },
        radius: 12,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#F4F4F5');
      fgHex = '#18181B';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.06 },
        offset: { x: 0, y: 3 },
        radius: 6,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  } else {
    // Solid Obsidian
    if (isDisabled) {
      setFill(root, '#E4E4E7');
      fgHex = '#A1A1AA';
    } else if (isActive) {
      setFill(root, '#09090B');
      fgHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.16 },
        offset: { x: 0, y: 2 },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else if (isHover) {
      setFill(root, '#27272A');
      fgHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.26 },
        offset: { x: 0, y: 7 },
        radius: 16,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    } else {
      setFill(root, '#18181B');
      fgHex = '#FFFFFF';
      root.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0, g: 0, b: 0, a: 0.18 },
        offset: { x: 0, y: 4 },
        radius: 10,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }
  }

  if (isExtended) {
    pad(root, padY, padX);
    root.itemSpacing = 8;
    root.appendChild(buildIcon(iconSz, fgHex, 'plus'));
    root.appendChild(text({ characters: 'Create New', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize, fill: fgHex }));
  } else {
    pad(root, 0, 0);
    root.resize(dim, dim);
    root.appendChild(buildIcon(iconSz, fgHex, 'plus'));
  }
  return root;
};

const SocialButton: Template = (root, ctx) => {
  const v = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isHover = sKey === 'hover';
  const isActive = sKey === 'active';
  const isDisabled = sKey === 'disabled';

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  pad(root, 8, 12);
  root.cornerRadius = 8;
  root.strokes = [];
  root.effects = [];

  let label = 'Sign in with Google';
  let iconName: IconKind = 'google';
  let bg = '#FFFFFF';
  let fg = '#18181B';
  let stroke = '#E4E4E7';

  if (v.includes('apple')) {
    label = 'Sign in with Apple';
    iconName = 'apple';
    if (isDisabled) {
      bg = '#71717A';
      fg = '#FFFFFF';
      stroke = '#71717A';
    } else if (isActive) {
      bg = '#000000';
      fg = '#FFFFFF';
      stroke = '#000000';
    } else if (isHover) {
      bg = '#27272A';
      fg = '#FFFFFF';
      stroke = '#27272A';
    } else {
      bg = '#09090B';
      fg = '#FFFFFF';
      stroke = '#09090B';
    }
  } else if (v.includes('github')) {
    label = 'Sign in with GitHub';
    iconName = 'github';
    if (isDisabled) {
      bg = '#71717A';
      fg = '#FFFFFF';
      stroke = '#71717A';
    } else if (isActive) {
      bg = '#18181B';
      fg = '#FFFFFF';
      stroke = '#18181B';
    } else if (isHover) {
      bg = '#2D333B';
      fg = '#FFFFFF';
      stroke = '#2D333B';
    } else {
      bg = '#24292E';
      fg = '#FFFFFF';
      stroke = '#24292E';
    }
  } else if (v.includes('microsoft')) {
    label = 'Sign in with Microsoft';
    iconName = 'microsoft';
    if (isDisabled) {
      bg = '#FAFAFA';
      fg = '#A1A1AA';
      stroke = '#E4E4E7';
    } else if (isActive) {
      bg = '#E4E4E7';
      fg = '#18181B';
      stroke = '#D4D4D8';
    } else if (isHover) {
      bg = '#F4F4F5';
      fg = '#18181B';
      stroke = '#D4D4D8';
    } else {
      bg = '#FFFFFF';
      fg = '#18181B';
      stroke = '#E4E4E7';
    }
  } else {
    // Google
    label = 'Sign in with Google';
    iconName = 'google';
    if (isDisabled) {
      bg = '#FAFAFA';
      fg = '#A1A1AA';
      stroke = '#E4E4E7';
    } else if (isActive) {
      bg = '#E4E4E7';
      fg = '#18181B';
      stroke = '#D4D4D8';
    } else if (isHover) {
      bg = '#F4F4F5';
      fg = '#18181B';
      stroke = '#D4D4D8';
    } else {
      bg = '#FFFFFF';
      fg = '#18181B';
      stroke = '#E4E4E7';
    }
  }

  setFill(root, bg);
  setStroke(root, stroke, 1);
  if (!isDisabled && (v.includes('google') || v.includes('microsoft'))) {
    root.effects = [{
      type: 'DROP_SHADOW',
      color: { r: 0, g: 0, b: 0, a: isHover ? 0.08 : 0.04 },
      offset: { x: 0, y: isHover ? 2 : 1 },
      radius: isHover ? 4 : 2,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
  }

  root.appendChild(buildIcon(18, fg, iconName));
  root.appendChild(text({ characters: label, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: fg }));
  return root;
};

const CopyButton: Template = (root, ctx) => {
  const v = variantKey(ctx);
  const isCopied = ctx.stateName.toLowerCase() === 'copied';
  const isHover = ctx.stateName.toLowerCase() === 'hover';
  const isBordered = v.includes('bordered');
  const isGhost = v.includes('ghost');

  const szHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 32 : 38));
  const padY = szHeight <= 32 ? 6 : 8;
  const padX = szHeight <= 32 ? 10 : 14;
  const fontSize = szHeight <= 32 ? 12 : 13;
  const iconSz = szHeight <= 32 ? 13 : 15;

  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  pad(root, padY, padX);
  root.cornerRadius = 6;
  root.strokes = [];
  root.effects = [];

  let bg = '#F4F4F5';
  let stroke = '#F4F4F5';
  let fg = '#18181B';

  if (isCopied) {
    bg = '#ECFDF5';
    stroke = '#A7F3D0';
    fg = '#059669';
  } else if (isGhost) {
    bg = isHover ? '#F4F4F5' : 'transparent';
    stroke = 'transparent';
    fg = '#18181B';
  } else if (isBordered) {
    bg = isHover ? '#F4F4F5' : '#FFFFFF';
    stroke = isHover ? '#D4D4D8' : '#E4E4E7';
    fg = '#18181B';
  } else {
    // Filled
    bg = isHover ? '#E4E4E7' : '#F4F4F5';
    stroke = isHover ? '#E4E4E7' : '#F4F4F5';
    fg = '#18181B';
  }

  if (bg !== 'transparent') setFill(root, bg);
  else root.fills = [];

  if (stroke !== 'transparent') setStroke(root, stroke, 1);
  else root.strokes = [];

  root.appendChild(buildIcon(iconSz, fg, isCopied ? 'check' : 'copy'));
  root.appendChild(text({
    characters: isCopied ? 'Copied!' : 'Copy snippet',
    fontFamily: ctx.config.fontFamily.body,
    weight: 600,
    fontSize,
    fill: fg,
  }));
  return root;
};

const PasswordInput: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const fieldHeight = 44;
  const fieldWidth = ctx.showcaseType === 'size' ? 240 : 176;

  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.itemSpacing = 6;
  root.resize(fieldWidth, fieldHeight);
  root.fills = [];
  root.strokes = [];

  const isFocus = sKey === 'focus' || sKey === 'focused';
  const isRevealed = sKey === 'revealed';
  const isDisabled = sKey === 'disabled';

  let bg = '#F1F3F5';
  let textFill = '#18181B';
  let iconColor = '#71717A';

  if (isDisabled) {
    bg = '#F8FAFC';
    textFill = '#A1A1AA';
    iconColor = '#A1A1AA';
    root.opacity = 0.6;
  } else if (isFocus) {
    bg = '#EEF2FF';
    textFill = '#18181B';
    iconColor = '#3B82F6';
  } else if (isRevealed) {
    bg = '#F1F3F5';
    textFill = '#18181B';
    iconColor = '#18181B';
  }

  const box = makeFrame('box');
  box.layoutMode = 'HORIZONTAL';
  box.counterAxisAlignItems = 'CENTER';
  box.primaryAxisAlignItems = 'SPACE_BETWEEN';
  box.resize(fieldWidth, fieldHeight);
  pad(box, 0, 14);
  box.cornerRadius = 10;
  setFill(box, bg);

  const left = hbox('left');
  left.itemSpacing = 8;
  left.appendChild(buildIcon(14, iconColor, 'lock'));

  let passStr = '••••••••••••';
  if (isFocus) passStr = '••••••••|';
  else if (isRevealed) passStr = 'p@ssw0rd99';

  left.appendChild(text({
    characters: passStr,
    fontFamily: ctx.config.fontFamily.body,
    weight: 500,
    fontSize: isRevealed ? 12 : 14,
    fill: textFill,
  }));
  box.appendChild(left);
  box.appendChild(buildIcon(14, iconColor, isRevealed ? 'eyeOff' : 'eye'));
  root.appendChild(box);

  if (vKey.includes('strength')) {
    const bar = makeFrame('strengthBar');
    bar.layoutMode = 'HORIZONTAL';
    bar.itemSpacing = 4;
    bar.resize(fieldWidth, 3);
    const segW = Math.floor((fieldWidth - 12) / 4);
    const filledCount = isDisabled ? 0 : isFocus || isRevealed ? 4 : 3;
    for (let i = 0; i < 4; i++) {
      const seg = rect(`seg-${i}`, segW, 3, i < filledCount ? '#16A34A' : '#E4E4E7');
      seg.cornerRadius = 9999;
      bar.appendChild(seg);
    }
    root.appendChild(bar);
  }
  return root;
};

const SearchInput: Template = (root, ctx) => {
  const vKey = variantKey(ctx);
  const sKey = ctx.stateName.toLowerCase();
  const isSizeShowcase = ctx.showcaseType === 'size';
  const fieldHeight = Number(ctx.sizeProps.height ?? (ctx.sizeName === 'sm' ? 36 : ctx.sizeName === 'lg' ? 52 : 44));
  const fieldWidth = isSizeShowcase ? 240 : 176;
  const fontSize = Number(ctx.sizeProps.fontSize ?? (fieldHeight <= 36 ? 12 : fieldHeight >= 50 ? 15 : 13));
  const padX = fieldHeight <= 36 ? 12 : fieldHeight >= 50 ? 16 : 14;
  const iconSz = fieldHeight <= 36 ? 13 : fieldHeight >= 50 ? 17 : 15;

  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(fieldWidth, fieldHeight);
  pad(root, 0, padX);
  root.cornerRadius = vKey.includes('pill') ? 9999 : 10;

  const isFocus = sKey === 'focus' || sKey === 'focused';
  const isResults = sKey === 'withresults';
  const isHover = sKey === 'hover';

  let bg = '#F1F3F5';
  let textFill = '#71717A';
  let iconColor = '#71717A';

  if (isFocus) {
    bg = '#EEF2FF';
    textFill = '#18181B';
    iconColor = '#3B82F6';
  } else if (isResults) {
    bg = '#E8F8EE';
    textFill = '#18181B';
    iconColor = '#16A34A';
  } else if (isHover) {
    bg = '#E8EAED';
    textFill = '#18181B';
  }

  setFill(root, bg);
  root.strokes = [];
  root.effects = [];

  const left = hbox('left');
  left.itemSpacing = 8;
  left.appendChild(buildIcon(iconSz, iconColor, 'search'));

  let searchStr = isSizeShowcase ? `Search (${fieldHeight}px)` : 'Search components…';
  if (isFocus) searchStr = 'Search query|';
  else if (isResults) searchStr = 'Found 12 items';

  left.appendChild(text({
    characters: searchStr,
    fontFamily: ctx.config.fontFamily.body,
    weight: isFocus || isResults ? 500 : 400,
    fontSize,
    fill: textFill,
  }));
  root.appendChild(left);

  // Right trailing element based on variant
  if (vKey.includes('shortcut')) {
    const kbd = makeFrame('kbd');
    kbd.layoutMode = 'HORIZONTAL';
    pad(kbd, 2, 6);
    kbd.cornerRadius = 4;
    setFill(kbd, '#E4E4E7');
    kbd.appendChild(text({ characters: '⌘K', fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: 10, fill: '#71717A' }));
    root.appendChild(kbd);
  } else if (vKey.includes('filter')) {
    root.appendChild(buildIcon(iconSz, isFocus ? '#3B82F6' : '#71717A', 'filter'));
  } else if (isResults) {
    root.appendChild(buildIcon(14, '#16A34A', 'check'));
  }

  return root;
};

const NumberInput: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(160, 40);
  pad(root, 4, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);

  root.appendChild(text({ characters: '42', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));

  const btns = vbox('btns');
  btns.itemSpacing = 2;
  const up = makeFrame('up');
  up.resize(20, 14);
  up.appendChild(buildIcon(10, colorShade(ctx.tokens, 'neutral', 600), 'chevronUp'));
  btns.appendChild(up);

  const down = makeFrame('down');
  down.resize(20, 14);
  down.appendChild(buildIcon(10, colorShade(ctx.tokens, 'neutral', 600), 'chevronDown'));
  btns.appendChild(down);

  root.appendChild(btns);
  return root;
};

const CurrencyInput: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.resize(200, 40);
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);

  const sym = variantKey(ctx).includes('eur') ? '€' : variantKey(ctx).includes('gbp') ? '£' : variantKey(ctx).includes('inr') ? '₹' : '$';
  root.appendChild(text({ characters: sym, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  root.appendChild(text({ characters: '1,450.00', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  return root;
};

const PhoneInput: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.resize(240, 40);
  pad(root, 6, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);

  const flagBox = hbox('flag');
  flagBox.itemSpacing = 4;
  flagBox.appendChild(text({ characters: '🇺🇸 +1', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  flagBox.appendChild(buildIcon(10, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  root.appendChild(flagBox);

  const sep = line(20, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(sep);

  root.appendChild(text({ characters: '(555) 019-2834', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  return root;
};

const PinInput: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  const count = variantKey(ctx).includes('6') ? 6 : 4;
  for (let i = 0; i < count; i++) {
    const box = makeFrame(`pin-${i}`);
    box.layoutMode = 'HORIZONTAL';
    box.primaryAxisAlignItems = 'CENTER';
    box.counterAxisAlignItems = 'CENTER';
    box.resize(40, 44);
    box.cornerRadius = 8;
    setFill(box, '#FFFFFF');
    setStroke(box, i === 0 ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 300), i === 0 ? 2 : 1);
    box.appendChild(text({ characters: i < 2 ? String(i + 7) : '', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    root.appendChild(box);
  }
  return root;
};

const RichTextEditor: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(340, 140);
  root.cornerRadius = 10;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.clipsContent = true;

  const bar = makeFrame('toolbar');
  bar.layoutMode = 'HORIZONTAL';
  bar.counterAxisAlignItems = 'CENTER';
  bar.itemSpacing = 8;
  bar.resize(340, 36);
  pad(bar, 6, 12);
  setFill(bar, colorShade(ctx.tokens, 'neutral', 50));
  setStroke(bar, colorShade(ctx.tokens, 'neutral', 200), 1);
  bar.appendChild(text({ characters: 'B', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  bar.appendChild(text({ characters: 'I', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  bar.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 700), 'list'));
  bar.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 700), 'image'));
  root.appendChild(bar);

  const body = makeFrame('body');
  pad(body, 12, 12);
  body.appendChild(text({ characters: 'Start drafting your rich document here…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  root.appendChild(body);
  return root;
};

const TagInput: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  root.resize(300, 44);
  pad(root, 6, 10);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);

  ['Design', 'System'].forEach((tag) => {
    const chip = makeFrame('chip');
    chip.layoutMode = 'HORIZONTAL';
    chip.counterAxisAlignItems = 'CENTER';
    chip.itemSpacing = 4;
    pad(chip, 3, 8);
    chip.cornerRadius = 9999;
    setFill(chip, colorShade(ctx.tokens, 'primary', 50));
    chip.appendChild(text({ characters: tag, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'primary', 700) }));
    chip.appendChild(buildIcon(10, colorShade(ctx.tokens, 'primary', 700), 'close'));
    root.appendChild(chip);
  });

  root.appendChild(text({ characters: 'Add tag…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  return root;
};

const CheckboxGroup: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'AUTO';
  root.itemSpacing = 8;
  ['Push notifications', 'Email summaries', 'SMS alerts'].forEach((item, i) => {
    const row = hbox('cbRow');
    row.itemSpacing = 8;
    const cb = makeFrame('cb');
    cb.resize(18, 18);
    cb.cornerRadius = 4;
    const isChecked = i < 2;
    setFill(cb, isChecked ? colorShade(ctx.tokens, 'primary', 500) : '#FFFFFF');
    setStroke(cb, isChecked ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 400), 1.5);
    if (isChecked) cb.appendChild(buildIcon(12, '#FFFFFF', 'check'));
    row.appendChild(cb);
    row.appendChild(text({ characters: item, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    root.appendChild(row);
  });
  return root;
};

const RadioCard: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(320, 72);
  pad(root, 14, 16);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'primary', 500), 2);

  const left = hbox('left');
  left.itemSpacing = 12;
  const radio = makeFrame('radio');
  radio.layoutMode = 'HORIZONTAL';
  radio.primaryAxisAlignItems = 'CENTER';
  radio.counterAxisAlignItems = 'CENTER';
  radio.resize(18, 18);
  radio.cornerRadius = 9999;
  setFill(radio, '#FFFFFF');
  setStroke(radio, colorShade(ctx.tokens, 'primary', 500), 2);
  const dot = ellipse('dot', 8, colorShade(ctx.tokens, 'primary', 500));
  radio.appendChild(dot);
  left.appendChild(radio);

  const copy = vbox('copy');
  copy.itemSpacing = 2;
  copy.appendChild(text({ characters: 'Pro Annual Plan', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  copy.appendChild(text({ characters: 'Billed yearly at $192 / year', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  left.appendChild(copy);
  root.appendChild(left);

  root.appendChild(text({ characters: '$16/mo', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 14, fill: colorShade(ctx.tokens, 'primary', 600) }));
  return root;
};

const RangeSlider: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.itemSpacing = 6;
  root.resize(240, 32);

  const bar = hbox('bar');
  bar.resize(240, 20);
  bar.itemSpacing = 0;
  bar.counterAxisAlignItems = 'CENTER';

  const tLeft = rect('tLeft', 40, 6, colorShade(ctx.tokens, 'neutral', 200));
  tLeft.cornerRadius = 9999;
  const k1 = ellipse('k1', 16, '#FFFFFF');
  setStroke(k1, colorShade(ctx.tokens, 'primary', 500), 2);
  const tActive = rect('tActive', 110, 6, colorShade(ctx.tokens, 'primary', 500));
  tActive.cornerRadius = 9999;
  const k2 = ellipse('k2', 16, '#FFFFFF');
  setStroke(k2, colorShade(ctx.tokens, 'primary', 500), 2);
  const tRight = rect('tRight', 58, 6, colorShade(ctx.tokens, 'neutral', 200));
  tRight.cornerRadius = 9999;

  bar.appendChild(tLeft);
  bar.appendChild(k1);
  bar.appendChild(tActive);
  bar.appendChild(k2);
  bar.appendChild(tRight);

  root.appendChild(bar);
  return root;
};

const MultiSelect: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(280, 42);
  pad(root, 6, 10);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);

  const pills = hbox('pills');
  pills.itemSpacing = 4;
  ['React', 'TypeScript'].forEach((p) => {
    const chip = makeFrame('chip');
    chip.layoutMode = 'HORIZONTAL';
    chip.counterAxisAlignItems = 'CENTER';
    chip.itemSpacing = 4;
    pad(chip, 2, 6);
    chip.cornerRadius = 4;
    setFill(chip, colorShade(ctx.tokens, 'neutral', 100));
    chip.appendChild(text({ characters: p, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    chip.appendChild(buildIcon(10, colorShade(ctx.tokens, 'neutral', 500), 'close'));
    pills.appendChild(chip);
  });
  root.appendChild(pills);
  root.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  return root;
};

const Cascader: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(240, 40);
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(text({ characters: 'North America / USA / California', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 500), 'arrowRight'));
  return root;
};

const Autocomplete: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(240, 100);

  const inp = makeFrame('inp');
  inp.layoutMode = 'HORIZONTAL';
  inp.counterAxisAlignItems = 'CENTER';
  inp.resize(240, 40);
  pad(inp, 8, 12);
  inp.cornerRadius = 8;
  setFill(inp, '#FFFFFF');
  setStroke(inp, colorShade(ctx.tokens, 'primary', 500), 2);
  inp.appendChild(text({ characters: 'San Fra', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(inp);

  const pop = makeFrame('pop');
  pop.layoutMode = 'VERTICAL';
  pop.itemSpacing = 2;
  pop.resize(240, 60);
  pad(pop, 4, 4);
  pop.cornerRadius = 8;
  setFill(pop, '#FFFFFF');
  setStroke(pop, colorShade(ctx.tokens, 'neutral', 200), 1);
  pop.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 10, spread: 0, visible: true, blendMode: 'NORMAL' }];
  
  const item1 = hbox('item1');
  pad(item1, 6, 8); item1.cornerRadius = 4; setFill(item1, colorShade(ctx.tokens, 'primary', 50));
  item1.appendChild(text({ characters: 'San Francisco, CA', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'primary', 700) }));
  pop.appendChild(item1);

  const item2 = hbox('item2');
  pad(item2, 6, 8); item2.cornerRadius = 4; item2.fills = [];
  item2.appendChild(text({ characters: 'San Fernando, CA', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  pop.appendChild(item2);

  root.appendChild(pop);
  return root;
};

const TreeSelect: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(240, 40);
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(text({ characters: 'src / components / Button', fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  root.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  return root;
};

const DateRangePicker: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 8;
  root.resize(260, 40);
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 400), 'calendar'));
  root.appendChild(text({ characters: 'Oct 12, 2026 – Oct 24, 2026', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  return root;
};

const Banner: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(320, 44);
  pad(root, 8, 16);
  root.cornerRadius = 8;
  setFill(root, colorShade(ctx.tokens, 'primary', 600));

  const left = hbox('left');
  left.itemSpacing = 8;
  left.appendChild(buildIcon(14, '#FFFFFF', 'zap'));
  left.appendChild(text({ characters: 'System maintenance tonight at 02:00 UTC.', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: '#FFFFFF' }));
  root.appendChild(left);
  root.appendChild(buildIcon(14, '#FFFFFF', 'close'));
  return root;
};

const ProgressCircle: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(64, 64);
  root.cornerRadius = 9999;
  setStroke(root, colorShade(ctx.tokens, 'primary', 500), 4);
  root.appendChild(text({ characters: '75%', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  return root;
};

const Navbar: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(340, 56);
  pad(root, 10, 16);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);

  const brand = hbox('brand');
  brand.itemSpacing = 8;
  const logo = ellipse('logo', 24, colorShade(ctx.tokens, 'primary', 500));
  brand.appendChild(logo);
  brand.appendChild(text({ characters: 'Instrument', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 15, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(brand);

  const links = hbox('links');
  links.itemSpacing = 12;
  ['Overview', 'Docs'].forEach((l, i) => {
    links.appendChild(text({ characters: l, fontFamily: ctx.config.fontFamily.body, weight: i === 0 ? 600 : 500, fontSize: 12, fill: i === 0 ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 600) }));
  });
  root.appendChild(links);

  const user = ellipse('user', 28, colorShade(ctx.tokens, 'neutral', 200));
  root.appendChild(user);
  return root;
};

const Sidebar: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(220, 180);
  pad(root, 16, 12);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.itemSpacing = 4;

  const items: { label: string; icon: IconKind; active: boolean }[] = [
    { label: 'Dashboard', icon: 'grid', active: true },
    { label: 'Projects', icon: 'folder', active: false },
    { label: 'Analytics', icon: 'trendingUp', active: false },
    { label: 'Settings', icon: 'lock', active: false },
  ];

  items.forEach((it) => {
    const row = makeFrame('row');
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.itemSpacing = 10;
    row.resize(196, 36);
    pad(row, 8, 10);
    row.cornerRadius = 8;
    setFill(row, it.active ? colorShade(ctx.tokens, 'primary', 50) : '#FFFFFF');
    row.appendChild(buildIcon(14, it.active ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 500), it.icon));
    row.appendChild(text({ characters: it.label, fontFamily: ctx.config.fontFamily.body, weight: it.active ? 600 : 500, fontSize: 13, fill: it.active ? colorShade(ctx.tokens, 'primary', 700) : colorShade(ctx.tokens, 'neutral', 700) }));
    root.appendChild(row);
  });
  return root;
};

const NavMenu: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.itemSpacing = 20;
  pad(root, 16, 20);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 6 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }];

  for (let c = 0; c < 2; c++) {
    const col = vbox(`col-${c}`);
    col.itemSpacing = 8;
    col.appendChild(text({ characters: c === 0 ? 'FEATURES' : 'RESOURCES', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 400) }));
    for (let r = 0; r < 3; r++) {
      col.appendChild(text({ characters: `Menu Item ${c * 3 + r + 1}`, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    }
    root.appendChild(col);
  }
  return root;
};

const PaginationDots: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 6;
  for (let i = 0; i < 4; i++) {
    if (i === 1) {
      const pill = rect('dot-active', 20, 6, colorShade(ctx.tokens, 'primary', 500));
      pill.cornerRadius = 9999;
      root.appendChild(pill);
    } else {
      const dot = ellipse(`dot-${i}`, 6, colorShade(ctx.tokens, 'neutral', 300));
      root.appendChild(dot);
    }
  }
  return root;
};

const BackToTop: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(44, 44);
  root.cornerRadius = 9999;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 3 }, radius: 8, spread: 0, visible: true, blendMode: 'NORMAL' }];
  root.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 700), 'arrowUp'));
  return root;
};

const AnchorNav: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 8;
  ['Overview', 'Installation', 'Usage Examples', 'API Reference'].forEach((item, i) => {
    const row = hbox('item');
    row.itemSpacing = 8;
    const indicator = rect('ind', 2, 16, i === 0 ? colorShade(ctx.tokens, 'primary', 500) : 'transparent');
    row.appendChild(indicator);
    row.appendChild(text({ characters: item, fontFamily: ctx.config.fontFamily.body, weight: i === 0 ? 600 : 400, fontSize: 12, fill: i === 0 ? colorShade(ctx.tokens, 'primary', 600) : colorShade(ctx.tokens, 'neutral', 500) }));
    root.appendChild(row);
  });
  return root;
};

const ProfileCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(280, 160);
  pad(root, 20, 20);
  root.cornerRadius = 16;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.itemSpacing = 14;

  const top = hbox('top');
  top.itemSpacing = 12;
  top.appendChild(ellipse('av', 44, colorShade(ctx.tokens, 'primary', 100)));
  const meta = vbox('meta');
  meta.itemSpacing = 2;
  meta.appendChild(text({ characters: 'Sophia Vance', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 14, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  meta.appendChild(text({ characters: 'Design Systems Lead', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  top.appendChild(meta);
  root.appendChild(top);

  const btn = makeFrame('followBtn');
  btn.layoutMode = 'HORIZONTAL';
  btn.primaryAxisAlignItems = 'CENTER';
  btn.counterAxisAlignItems = 'CENTER';
  btn.resize(240, 34);
  btn.cornerRadius = 9999;
  setFill(btn, '#18181B');
  btn.appendChild(text({ characters: 'Follow Profile', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: '#FFFFFF' }));
  root.appendChild(btn);
  return root;
};

const MetricCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(220, 100);
  pad(root, 16, 16);
  root.cornerRadius = 14;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.itemSpacing = 8;

  root.appendChild(text({ characters: 'Total Revenue', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));

  const btm = hbox('btm');
  btm.itemSpacing = 8;
  btm.appendChild(text({ characters: '$48,290', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 20, fill: colorShade(ctx.tokens, 'neutral', 900) }));

  const badge = makeFrame('badge');
  badge.layoutMode = 'HORIZONTAL';
  badge.counterAxisAlignItems = 'CENTER';
  pad(badge, 2, 6);
  badge.cornerRadius = 4;
  setFill(badge, colorShade(ctx.tokens, 'success', 50));
  badge.appendChild(text({ characters: '+14.2%', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 10, fill: colorShade(ctx.tokens, 'success', 700) }));
  btm.appendChild(badge);

  root.appendChild(btm);
  return root;
};

const PricingCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(260, 200);
  pad(root, 20, 20);
  root.cornerRadius = 16;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'primary', 500), 2);
  root.itemSpacing = 12;

  root.appendChild(text({ characters: 'Pro Growth', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 16, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  
  const priceRow = hbox('priceRow');
  priceRow.itemSpacing = 4;
  priceRow.appendChild(text({ characters: '$29', fontFamily: ctx.config.fontFamily.heading, weight: 800, fontSize: 24, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  priceRow.appendChild(text({ characters: '/ month', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  root.appendChild(priceRow);

  const features = vbox('features');
  features.itemSpacing = 6;
  ['Unlimited projects', 'Custom tokens export', 'Team collaboration'].forEach((f) => {
    const fRow = hbox('fRow');
    fRow.itemSpacing = 6;
    fRow.appendChild(buildIcon(12, colorShade(ctx.tokens, 'success', 600), 'check'));
    fRow.appendChild(text({ characters: f, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 700) }));
    features.appendChild(fRow);
  });
  root.appendChild(features);
  return root;
};

const BentoCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(260, 140);
  pad(root, 18, 18);
  root.cornerRadius = 18;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.04 }, offset: { x: 0, y: 2 }, radius: 10, spread: 0, visible: true, blendMode: 'NORMAL' }];
  root.itemSpacing = 8;

  root.appendChild(buildIcon(20, colorShade(ctx.tokens, 'primary', 500), 'zap'));
  root.appendChild(text({ characters: 'Real-time Sync', fontFamily: ctx.config.fontFamily.heading, weight: 700, fontSize: 15, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(text({ characters: 'Synchronise components effortlessly across your entire file.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const ProductCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(220, 200);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.clipsContent = true;

  const img = makeFrame('img');
  img.resize(220, 110);
  setFill(img, colorShade(ctx.tokens, 'neutral', 100));
  img.appendChild(buildIcon(24, colorShade(ctx.tokens, 'neutral', 400), 'image'));
  root.appendChild(img);

  const info = vbox('info');
  info.itemSpacing = 4;
  pad(info, 10, 12);
  info.appendChild(text({ characters: 'Wireless Headphones', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  info.appendChild(text({ characters: '$199.00', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 14, fill: colorShade(ctx.tokens, 'primary', 600) }));
  root.appendChild(info);
  return root;
};

const ReviewCard: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(260, 110);
  pad(root, 14, 14);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.itemSpacing = 6;

  const stars = hbox('stars');
  stars.itemSpacing = 2;
  for (let i = 0; i < 5; i++) stars.appendChild(buildIcon(12, '#F59E0B', 'star'));
  root.appendChild(stars);

  root.appendChild(text({ characters: '“The best design token generator for Figma by far.”', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.appendChild(text({ characters: 'Alex R., Product Designer', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const Collapsible: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisSizingMode = 'AUTO';
  root.counterAxisSizingMode = 'FIXED';
  root.resize(280, 80);
  pad(root, 10, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.itemSpacing = 6;

  const h = hbox('header');
  h.counterAxisAlignItems = 'CENTER';
  h.primaryAxisAlignItems = 'SPACE_BETWEEN';
  h.resize(256, 24);
  h.appendChild(text({ characters: 'Advanced Configuration', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  h.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 500), 'chevronDown'));
  root.appendChild(h);

  root.appendChild(text({ characters: 'Toggle extended settings for styles and variables.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const Timeline: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 12;
  pad(root, 4, 8);

  const steps = ['Order placed', 'Processing in warehouse', 'Out for delivery'];
  steps.forEach((st, i) => {
    const row = hbox('row');
    row.itemSpacing = 10;
    row.counterAxisAlignItems = 'CENTER';
    const dot = ellipse(`dot-${i}`, 10, i === 0 ? colorShade(ctx.tokens, 'primary', 500) : colorShade(ctx.tokens, 'neutral', 300));
    row.appendChild(dot);
    row.appendChild(text({ characters: st, fontFamily: ctx.config.fontFamily.body, weight: i === 0 ? 600 : 400, fontSize: 12, fill: i === 0 ? colorShade(ctx.tokens, 'neutral', 900) : colorShade(ctx.tokens, 'neutral', 500) }));
    root.appendChild(row);
  });
  return root;
};

const DataList: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 6;
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);

  const data: [string, string][] = [['Version', '1.0.4'], ['License', 'MIT'], ['Status', 'Active']];
  data.forEach(([k, v]) => {
    const row = hbox('row');
    row.primaryAxisAlignItems = 'SPACE_BETWEEN';
    row.resize(220, 20);
    row.appendChild(text({ characters: k, fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 500) }));
    row.appendChild(text({ characters: v, fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 900) }));
    root.appendChild(row);
  });
  return root;
};

const Statistic: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 2;
  root.appendChild(text({ characters: 'Active Subscribers', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  root.appendChild(text({ characters: '124,800', fontFamily: ctx.config.fontFamily.heading, weight: 800, fontSize: 24, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  return root;
};

const Kbd: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  pad(root, 3, 8);
  root.cornerRadius = 6;
  setFill(root, colorShade(ctx.tokens, 'neutral', 100));
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(text({ characters: '⌘ + Shift + P', fontFamily: ctx.config.fontFamily.mono, weight: 600, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  return root;
};

const Tree: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.itemSpacing = 6;
  ['📁 src', '  📁 components', '    📄 Button.tsx', '  📁 utils'].forEach((lineStr) => {
    root.appendChild(text({ characters: lineStr, fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  });
  return root;
};

const CodeBlock: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.resize(280, 70);
  pad(root, 10, 12);
  root.cornerRadius = 8;
  setFill(root, '#0F172A');
  root.appendChild(text({ characters: 'import { Button } from "@ds/kit";', fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 11, fill: '#38BDF8' }));
  root.appendChild(text({ characters: 'export default () => <Button />;', fontFamily: ctx.config.fontFamily.mono, weight: 400, fontSize: 11, fill: '#F8FAFC' }));
  return root;
};

const BottomSheet: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(280, 120);
  pad(root, 8, 16);
  root.cornerRadius = 16;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.12 }, offset: { x: 0, y: -4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' }];

  const handle = rect('handle', 36, 4, colorShade(ctx.tokens, 'neutral', 300));
  handle.cornerRadius = 9999;
  root.appendChild(handle);
  root.appendChild(text({ characters: 'Share options', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  return root;
};

const AlertDialog: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.resize(260, 110);
  pad(root, 14, 16);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'error', 300), 1);
  root.itemSpacing = 8;

  root.appendChild(text({ characters: 'Delete this project?', fontFamily: ctx.config.fontFamily.body, weight: 700, fontSize: 13, fill: colorShade(ctx.tokens, 'error', 700) }));
  root.appendChild(text({ characters: 'This action cannot be undone.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const ContextMenu: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.resize(160, 100);
  pad(root, 6, 6);
  root.cornerRadius = 8;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.1 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' }];

  ['Edit layer', 'Duplicate', 'Delete'].forEach((act) => {
    const row = hbox('act');
    row.itemSpacing = 6;
    pad(row, 4, 8); row.cornerRadius = 4;
    row.appendChild(text({ characters: act, fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 800) }));
    root.appendChild(row);
  });
  return root;
};

const CommandMenu: Template = (root, ctx) => {
  root.layoutMode = 'VERTICAL';
  root.resize(280, 110);
  pad(root, 10, 12);
  root.cornerRadius = 12;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.itemSpacing = 8;

  const searchRow = hbox('sRow');
  searchRow.itemSpacing = 8;
  searchRow.appendChild(buildIcon(14, colorShade(ctx.tokens, 'neutral', 400), 'search'));
  searchRow.appendChild(text({ characters: 'Type a command…', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 400) }));
  root.appendChild(searchRow);

  const divider = rect('div', 256, 1, colorShade(ctx.tokens, 'neutral', 200));
  root.appendChild(divider);
  return root;
};

const Lightbox: Template = (root, _ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(280, 140);
  root.cornerRadius = 12;
  setFill(root, '#09090B');
  root.appendChild(buildIcon(32, '#A1A1AA', 'image'));
  return root;
};

const CookieBanner: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(320, 60);
  pad(root, 10, 14);
  root.cornerRadius = 10;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);
  root.effects = [{ type: 'DROP_SHADOW', color: { r: 0, g: 0, b: 0, a: 0.08 }, offset: { x: 0, y: 4 }, radius: 12, spread: 0, visible: true, blendMode: 'NORMAL' }];

  root.appendChild(text({ characters: 'We use cookies to improve your experience.', fontFamily: ctx.config.fontFamily.body, weight: 400, fontSize: 11, fill: colorShade(ctx.tokens, 'neutral', 700) }));
  return root;
};

const FileList: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(280, 44);
  pad(root, 8, 12);
  root.cornerRadius = 8;
  setFill(root, colorShade(ctx.tokens, 'neutral', 50));
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);

  const left = hbox('left');
  left.itemSpacing = 8;
  left.appendChild(buildIcon(14, colorShade(ctx.tokens, 'primary', 600), 'file'));
  left.appendChild(text({ characters: 'design-tokens.json', fontFamily: ctx.config.fontFamily.body, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 900) }));
  root.appendChild(left);
  root.appendChild(buildIcon(12, colorShade(ctx.tokens, 'neutral', 400), 'close'));
  return root;
};

const AudioPlayer: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.itemSpacing = 10;
  root.resize(240, 44);
  pad(root, 6, 12);
  root.cornerRadius = 9999;
  setFill(root, '#FFFFFF');
  setStroke(root, colorShade(ctx.tokens, 'neutral', 200), 1);

  const playBtn = makeFrame('playBtn');
  playBtn.resize(28, 28);
  playBtn.cornerRadius = 9999;
  playBtn.layoutMode = 'HORIZONTAL';
  playBtn.primaryAxisAlignItems = 'CENTER';
  playBtn.counterAxisAlignItems = 'CENTER';
  setFill(playBtn, colorShade(ctx.tokens, 'primary', 500));
  playBtn.appendChild(buildIcon(12, '#FFFFFF', 'play'));
  root.appendChild(playBtn);

  const wave = rect('wave', 130, 4, colorShade(ctx.tokens, 'neutral', 300));
  wave.cornerRadius = 9999;
  root.appendChild(wave);
  root.appendChild(text({ characters: '02:45', fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: 10, fill: colorShade(ctx.tokens, 'neutral', 500) }));
  return root;
};

const VideoPlayer: Template = (root, _ctx) => {
  root.layoutMode = 'VERTICAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(260, 140);
  root.cornerRadius = 10;
  setFill(root, '#0F172A');

  const pBtn = makeFrame('pBtn');
  pBtn.resize(40, 40);
  pBtn.cornerRadius = 9999;
  pBtn.layoutMode = 'HORIZONTAL';
  pBtn.primaryAxisAlignItems = 'CENTER';
  pBtn.counterAxisAlignItems = 'CENTER';
  setFill(pBtn, '#FFFFFF');
  pBtn.appendChild(buildIcon(16, '#0F172A', 'play'));
  root.appendChild(pBtn);
  return root;
};

const Carousel: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.counterAxisAlignItems = 'CENTER';
  root.primaryAxisAlignItems = 'SPACE_BETWEEN';
  root.resize(260, 120);
  pad(root, 8, 10);
  root.cornerRadius = 10;
  setFill(root, colorShade(ctx.tokens, 'neutral', 100));

  root.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 600), 'chevronLeft'));
  root.appendChild(text({ characters: 'Slide Feature Showcase', fontFamily: ctx.config.fontFamily.body, weight: 600, fontSize: 13, fill: colorShade(ctx.tokens, 'neutral', 800) }));
  root.appendChild(buildIcon(16, colorShade(ctx.tokens, 'neutral', 600), 'chevronRight'));
  return root;
};

const AspectRatio: Template = (root, ctx) => {
  root.layoutMode = 'HORIZONTAL';
  root.primaryAxisAlignItems = 'CENTER';
  root.counterAxisAlignItems = 'CENTER';
  root.resize(240, 135); // 16:9
  root.cornerRadius = 8;
  setFill(root, colorShade(ctx.tokens, 'neutral', 100));
  setStroke(root, colorShade(ctx.tokens, 'neutral', 300), 1);
  root.appendChild(text({ characters: '16 : 9 Aspect Ratio', fontFamily: ctx.config.fontFamily.mono, weight: 500, fontSize: 12, fill: colorShade(ctx.tokens, 'neutral', 600) }));
  return root;
};

// ---------------- registry ----------------

export const TEMPLATES: Record<string, Template> = {
  Button,
  IconButton,
  ButtonGroup,
  SegmentedControl,
  SplitButton,
  FloatingActionButton,
  SocialButton,
  CopyButton,
  Input,
  PasswordInput,
  SearchInput,
  NumberInput,
  CurrencyInput,
  PhoneInput,
  PinInput,
  Textarea,
  RichTextEditor,
  TagInput,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioCard,
  Switch,
  Slider,
  RangeSlider,
  Rating,
  Select,
  MultiSelect,
  Cascader,
  Autocomplete,
  TreeSelect,
  ColorPicker,
  DatePicker,
  DateRangePicker,
  Alert,
  Badge,
  Tag,
  Toast,
  Banner,
  ProgressBar: Progress,
  ProgressCircle,
  Progress,
  Spinner,
  Skeleton,
  EmptyState,
  Tabs,
  Breadcrumb,
  Pagination,
  Navbar,
  Sidebar,
  NavMenu,
  Stepper,
  PaginationDots,
  BackToTop,
  AnchorNav,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  ProfileCard,
  MetricCard,
  PricingCard,
  BentoCard,
  ProductCard,
  ReviewCard,
  Accordion,
  Collapsible,
  Timeline,
  Table,
  DataGrid,
  DataList,
  List,
  Avatar,
  AvatarGroup: AvatarStack,
  AvatarStack,
  Tooltip,
  Popover,
  Statistic,
  Kbd,
  Tree,
  CodeBlock,
  Modal,
  Drawer,
  BottomSheet,
  AlertDialog,
  ContextMenu,
  CommandMenu,
  Lightbox,
  CookieBanner,
  FileUploader: FileUpload,
  FileUpload,
  FileList,
  ImageGallery: Image,
  Image,
  AudioPlayer,
  VideoPlayer,
  Carousel,
  AspectRatio,
  Divider,
  DropdownMenu,
  TimePicker,
  Grid,
  Stack,
  Container,
  ScrollArea,
  Icon,
  Link,
};
