// The two alias tables that turn a raw colour ramp into a design system:
// which primitive each semantic role points at, and which semantic role each
// component slot points at.
//
// Pure data, and deliberately in src/shared rather than next to the code that
// builds Figma Variables. Two consumers need it now — variables.ts, to create the
// Semantic and Component collections, and the DTCG exporter, to emit the same
// three tiers as `{alias}` references — and a second copy of a 48-row mapping is
// a guaranteed source of drift between what the plugin puts on the canvas and
// what it writes to a file.

export type PrimitiveColorName =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'information'
  | 'neutral';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/**
 * A pointer at one primitive colour.
 *
 * `white` and `black` are anchors rather than ramp entries, so they carry shade
 * `0` — there is only one of each, and a shade would be a lie about it.
 */
export type ColorRef = [PrimitiveColorName | 'white' | 'black', Shade | 0];

export interface SemanticDef {
  /** sub-path under "Color/", e.g. "Primary/Hover" → Color/Primary/Hover */
  name: string;
  light: ColorRef;
  /** falls back to `light` when dark mode is on */
  dark?: ColorRef;
}

export interface ComponentDef {
  /** full path, e.g. "Button/Background/Default" */
  name: string;
  /** semantic sub-path it aliases, e.g. "Primary" → Color/Primary */
  semantic: string;
}

// ---- Tier 2: semantic token definitions (Light → Dark primitive refs) ----
export const SEMANTIC_DEFS: SemanticDef[] = [
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
export const COMPONENT_DEFS: ComponentDef[] = [
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
