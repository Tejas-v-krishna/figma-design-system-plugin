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
import {
  SEMANTIC_DEFS,
  COMPONENT_DEFS,
  PrimitiveColorName,
  ColorRef,
} from '../../shared/semantic-defs';
import { colorStyleKey, semanticColorKey } from './styleKeys';

export interface VariableMap {
  primitive: Record<string, Variable>;
  semantic: Record<string, Variable>;
  component: Record<string, Variable>;
}

export function emptyVariableMap(): VariableMap {
  return { primitive: {}, semantic: {}, component: {} };
}

// ColorName is the ramp subset the alias tables reference; the tables and their
// types now live in src/shared/semantic-defs.ts so the DTCG exporter can emit the
// same three tiers without importing anything that touches `figma`.
type ColorName = PrimitiveColorName;

/**
 * Creates the 3-tier COLOR variable collections and returns maps keyed by
 * primitive / semantic / component name so the factory and composed pages can
 * bind fills by key. No-ops (empty map) when the option is off.
 */
/**
 * Mode id of a freshly created collection.
 *
 * createVariableCollection always returns one mode, but reading modes[0]
 * directly cannot prove it. Throwing a named error here beats letting
 * `undefined` reach setValueForMode, which fails with a message that mentions
 * neither the collection nor variables.
 */
function firstModeId(collection: VariableCollection): string {
  const mode = collection.modes[0];
  if (!mode) throw new Error(`Variable collection "${collection.name}" was created with no modes.`);
  return mode.modeId;
}

export function createVariables(tokens: DesignTokens, config: GenerationConfig): VariableMap {
  const map = emptyVariableMap();
  if (!config.options.createVariables) return map;

  const brand = config.brandName || 'Design System';

  // ---------- Tier 1: Primitives ----------
  const primCollection = figma.variables.createVariableCollection(`${brand} / Primitives`);
  const primMode = firstModeId(primCollection);
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

  // Returns undefined for a shade the palette does not contain, rather than
  // claiming a Variable. An undefined passed to createVariableAlias throws from
  // inside the Figma API, which used to abort the whole variable pass.
  const lookupPrimitive = (ref: ColorRef): Variable | undefined => {
    const [name, shade] = ref;
    if (name === 'white') return primitiveByName['Color/White'];
    if (name === 'black') return primitiveByName['Color/Black'];
    return primitiveByName[colorStyleKey(name, shade)];
  };

  // ---------- Tier 2: Semantic ----------
  const semCollection = figma.variables.createVariableCollection(`${brand} / Semantic`);
  const semLight = firstModeId(semCollection);
  semCollection.renameMode(semLight, 'Light');
  const semDark = config.options.includeDarkMode ? semCollection.addMode('Dark') : undefined;

  for (const d of SEMANTIC_DEFS) {
    const name = semanticColorKey(d.name);
    const lightRef = lookupPrimitive(d.light);
    if (!lightRef) {
      console.warn(`[design-system-kit] skipping semantic variable ${name}: no primitive for ${d.light.join('/')}`);
      continue;
    }
    const v = figma.variables.createVariable(name, semCollection, 'COLOR');
    v.setValueForMode(semLight, figma.variables.createVariableAlias(lightRef));
    if (semDark) {
      const darkRef = lookupPrimitive(d.dark ?? d.light) ?? lightRef;
      v.setValueForMode(semDark, figma.variables.createVariableAlias(darkRef));
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
  const compLight = firstModeId(compCollection);
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
