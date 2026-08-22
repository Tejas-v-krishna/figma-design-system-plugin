// Builds a canonical 3-tier Figma Variables architecture from the generated
// color tokens:
//
//   Tier 1 — Primitives  : raw concrete color values, one per shade. Mode-less
//                          (the source of truth). The factory continues to bind
//                          component fills to these by the same colorStyleKey it
//                          uses for Paint Styles.
//   Tier 2 — Semantic    : meaningful, named aliases to primitives (Color/Primary,
//                          Color/Text/Default, Color/Surface/Raised, …). Gains a
//                          "Dark" mode when dark mode is enabled, whose aliases
//                          point at different primitives.
//   Tier 3 — Component    : per-component aliases to semantic tokens
//                          (Button/Background/Default, Input/Border/Focus, …).
//                          Also gets a "Dark" mode so the whole system themes in
//                          lock-step with the semantic tier.
//
// The returned VariableMap is keyed so a caller can bind a node's fill by either
// a primitive colorStyleKey (Tier 1) or a semantic/component key (Tier 2/3);
// `resolveColorVariable` in primitives.ts picks the highest tier that defines it.
import { DesignTokens, GenerationConfig, ColorToken } from '../../shared/types';
import { hexToRgb } from '../../shared/color-utils';
import { colorStyleKey, semanticColorKey } from './styleKeys';

export interface VariableMap {
  primitive: Record<string, Variable>;
  semantic: Record<string, Variable>;
  component: Record<string, Variable>;
}

export function emptyVariableMap(): VariableMap {
  return { primitive: {}, semantic: {}, component: {} };
}

type ColorName = 'primary' | 'success' | 'error' | 'warning' | 'information' | 'neutral';
type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;
type ColorRef = [ColorName | 'white' | 'black', Shade | 0];

interface SemanticDef {
  /** sub-path under "Color/", e.g. "Primary/Hover" → Color/Primary/Hover */
  name: string;
  light: ColorRef;
  /** falls back to `light` when dark mode is on */
  dark?: ColorRef;
}

interface ComponentDef {
  /** full path, e.g. "Button/Background/Default" */
  name: string;
  /** semantic sub-path it aliases, e.g. "Primary" → Color/Primary */
  semantic: string;
}

// ---- Tier 2: semantic token definitions (Light → Dark primitive refs) ----
const SEMANTIC_DEFS: SemanticDef[] = [
  // Accent
  { name: 'Primary', light: ['primary', 500], dark: ['primary', 400] },
  { name: 'Primary/Hover', light: ['primary', 600], dark: ['primary', 300] },
  { name: 'Primary/Pressed', light: ['primary', 700], dark: ['primary', 200] },
  { name: 'Primary/Subtle', light: ['primary', 50], dark: ['primary', 950] },
  { name: 'Primary/SubtleText', light: ['primary', 700], dark: ['primary', 300] },
  { name: 'OnPrimary', light: ['white', 0], dark: ['white', 0] },

  // Feedback accents
  { name: 'Success', light: ['success', 500], dark: ['success', 400] },
  { name: 'Success/Subtle', light: ['success', 50], dark: ['success', 950] },
  { name: 'Warning', light: ['warning', 500], dark: ['warning', 400] },
  { name: 'Warning/Subtle', light: ['warning', 50], dark: ['warning', 950] },
  { name: 'Error', light: ['error', 500], dark: ['error', 400] },
  { name: 'Error/Subtle', light: ['error', 50], dark: ['error', 950] },
  { name: 'Info', light: ['information', 500], dark: ['information', 400] },
  { name: 'Info/Subtle', light: ['information', 50], dark: ['information', 950] },

  // Text
  { name: 'Text/Default', light: ['neutral', 900], dark: ['neutral', 100] },
  { name: 'Text/Secondary', light: ['neutral', 600], dark: ['neutral', 400] },
  { name: 'Text/Muted', light: ['neutral', 400], dark: ['neutral', 500] },
  { name: 'Text/Inverse', light: ['white', 0], dark: ['black', 0] },
  { name: 'Text/Link', light: ['primary', 600], dark: ['primary', 400] },

  // Surface
  { name: 'Surface/Default', light: ['white', 0], dark: ['neutral', 950] },
  { name: 'Surface/Subtle', light: ['neutral', 50], dark: ['neutral', 900] },
  { name: 'Surface/Muted', light: ['neutral', 100], dark: ['neutral', 800] },
  { name: 'Surface/Raised', light: ['white', 0], dark: ['neutral', 900] },
  { name: 'Surface/Inverse', light: ['neutral', 900], dark: ['neutral', 50] },
  { name: 'Background', light: ['white', 0], dark: ['neutral', 950] },

  // Border
  { name: 'Border/Default', light: ['neutral', 200], dark: ['neutral', 800] },
  { name: 'Border/Strong', light: ['neutral', 300], dark: ['neutral', 700] },
  { name: 'Border/Subtle', light: ['neutral', 100], dark: ['neutral', 900] },
];

// ---- Tier 3: component token definitions (alias → semantic sub-path) ----
const COMPONENT_DEFS: ComponentDef[] = [
  { name: 'Button/Background/Default', semantic: 'Primary' },
  { name: 'Button/Background/Hover', semantic: 'Primary/Hover' },
  { name: 'Button/Background/Pressed', semantic: 'Primary/Pressed' },
  { name: 'Button/Text/Default', semantic: 'OnPrimary' },
  { name: 'Button/Border/Default', semantic: 'Primary' },
  { name: 'Button/Disabled/Background', semantic: 'Surface/Muted' },
  { name: 'Button/Disabled/Text', semantic: 'Text/Muted' },

  { name: 'Input/Background/Default', semantic: 'Surface/Default' },
  { name: 'Input/Border/Default', semantic: 'Border/Default' },
  { name: 'Input/Border/Focus', semantic: 'Primary' },
  { name: 'Input/Text/Default', semantic: 'Text/Default' },
  { name: 'Input/Placeholder/Default', semantic: 'Text/Muted' },

  { name: 'Card/Background/Default', semantic: 'Surface/Raised' },
  { name: 'Card/Border/Default', semantic: 'Border/Subtle' },

  { name: 'Badge/Background/Default', semantic: 'Primary/Subtle' },
  { name: 'Badge/Text/Default', semantic: 'Primary/SubtleText' },

  { name: 'Surface/Background', semantic: 'Surface/Default' },
  { name: 'Surface/Text', semantic: 'Text/Default' },
];

/**
 * Creates the 3-tier COLOR variable collections and returns maps keyed by
 * primitive / semantic / component name so the factory and composed pages can
 * bind fills by key. No-ops (empty map) when the option is off.
 */
export function createVariables(tokens: DesignTokens, config: GenerationConfig): VariableMap {
  const map = emptyVariableMap();
  if (!config.options.createVariables) return map;

  const brand = config.brandName || 'Design System';

  // ---------- Tier 1: Primitives ----------
  const primCollection = figma.variables.createVariableCollection(`${brand} / Primitives`);
  const primMode = primCollection.modes[0].modeId;
  primCollection.renameMode(primMode, 'Light');

  const primitiveByName: Record<string, Variable> = {};
  const makePrimitive = (name: string, hex: string): Variable => {
    const v = figma.variables.createVariable(name, primCollection, 'COLOR');
    v.setValueForMode(primMode, hexToRgb(hex));
    return v;
  };

  // one primitive variable per color shade
  for (const [colorName, ct] of Object.entries(tokens.colors) as [ColorName, ColorToken][]) {
    for (const [shade, hex] of Object.entries(ct.shades)) {
      const key = colorStyleKey(colorName, shade);
      const v = makePrimitive(key, hex);
      primitiveByName[key] = v;
      map.primitive[key] = v;
    }
  }
  // white / black anchors for text-on-color and surface tokens
  primitiveByName['Color/White'] = makePrimitive('Color/White', '#FFFFFF');
  primitiveByName['Color/Black'] = makePrimitive('Color/Black', '#000000');
  map.primitive['Color/White'] = primitiveByName['Color/White'];
  map.primitive['Color/Black'] = primitiveByName['Color/Black'];

  const lookupPrimitive = (ref: ColorRef): Variable => {
    const [name, shade] = ref;
    if (name === 'white') return primitiveByName['Color/White'];
    if (name === 'black') return primitiveByName['Color/Black'];
    return primitiveByName[colorStyleKey(name, shade)];
  };

  // ---------- Tier 2: Semantic ----------
  const semCollection = figma.variables.createVariableCollection(`${brand} / Semantic`);
  const semLight = semCollection.modes[0].modeId;
  semCollection.renameMode(semLight, 'Light');
  const semDark = config.options.includeDarkMode ? semCollection.addMode('Dark') : undefined;

  for (const d of SEMANTIC_DEFS) {
    const name = semanticColorKey(d.name);
    const v = figma.variables.createVariable(name, semCollection, 'COLOR');
    v.setValueForMode(semLight, figma.variables.createVariableAlias(lookupPrimitive(d.light)));
    if (semDark) {
      v.setValueForMode(semDark, figma.variables.createVariableAlias(lookupPrimitive(d.dark ?? d.light)));
    }
    map.semantic[name] = v;
  }

  // Per-shade ramp aliases so component *templates* (which bind by
  // colorStyleKey(colorName, shade), e.g. Color/Primary/500) resolve HERE
  // instead of primitives — and therefore dark-theme via the mirror below.
  // In dark mode each shade flips to its mirror (50↔950, 500↔500), so a
  // neutral/200 border becomes neutral/800 and neutral/900 text becomes
  // neutral/100, etc.
  const mirrorShade = (shade: number): number => 1000 - shade;
  for (const [colorName, ct] of Object.entries(tokens.colors) as [ColorName, ColorToken][]) {
    for (const [shade] of Object.entries(ct.shades)) {
      const key = colorStyleKey(colorName, shade);
      if (map.semantic[key]) continue; // a named token already owns this path
      const lightVar = primitiveByName[key];
      const darkVar = semDark ? primitiveByName[colorStyleKey(colorName, mirrorShade(Number(shade)))] : undefined;
      if (!lightVar || (semDark && !darkVar)) continue;
      const v = figma.variables.createVariable(key, semCollection, 'COLOR');
      v.setValueForMode(semLight, figma.variables.createVariableAlias(lightVar));
      if (semDark && darkVar) v.setValueForMode(semDark, figma.variables.createVariableAlias(darkVar));
      map.semantic[key] = v;
    }
  }

  // ---------- Tier 3: Component ----------
  const compCollection = figma.variables.createVariableCollection(`${brand} / Components`);
  const compLight = compCollection.modes[0].modeId;
  compCollection.renameMode(compLight, 'Light');
  const compDark = config.options.includeDarkMode ? compCollection.addMode('Dark') : undefined;

  for (const d of COMPONENT_DEFS) {
    const target = map.semantic[semanticColorKey(d.semantic)];
    if (!target) continue;
    const v = figma.variables.createVariable(d.name, compCollection, 'COLOR');
    // Both modes alias the same semantic variable — its own mode resolves the
    // dark primitive, so the component tier themes for free.
    v.setValueForMode(compLight, figma.variables.createVariableAlias(target));
    if (compDark) v.setValueForMode(compDark, figma.variables.createVariableAlias(target));
    map.component[d.name] = v;
  }

  return map;
}
