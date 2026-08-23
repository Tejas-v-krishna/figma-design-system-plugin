// Design System Kit - Shared Type Definitions

export type ComponentCategory =
  | 'buttons'
  | 'inputs'
  | 'forms'
  | 'cards'
  | 'feedback'
  | 'navigation'
  | 'data-display'
  | 'overlays'
  | 'media'
  | 'typography';

export type TypographyGroup = 'headings' | 'body' | 'ui';

export type RadiusPreset = 'sharp' | 'rounded' | 'pill';
export type EffectsIntensity = 'none' | 'subtle' | 'medium' | 'strong';

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ColorToken {
  name: string;
  hex: string;
  hsl: HSLColor;
  shades: ColorShades;
  darkShades?: ColorShades;
}

export interface TypographyToken {
  name: string;
  group: TypographyGroup;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  underline?: boolean;
}

export interface SpacingToken {
  name: string;
  value: number;
  rem: string;
}

export interface ShadowToken {
  name: string;
  value: string;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

export interface BorderRadiusToken {
  name: string;
  value: string;
  px: number;
}

export interface StrokeToken {
  name: string;
  value: number;
}

export interface DesignTokens {
  colors: {
    primary: ColorToken;
    secondary: ColorToken;
    accent: ColorToken;
    success: ColorToken;
    error: ColorToken;
    warning: ColorToken;
    information: ColorToken;
    neutral: ColorToken;
    [key: string]: ColorToken;
  };
  typography: TypographyToken[];
  spacing: SpacingToken[];
  shadows: ShadowToken[];
  borderRadius: BorderRadiusToken[];
  strokes: StrokeToken[];
}

export interface FontFamilies {
  heading: string;
  body: string;
  mono: string;
}

export interface GenerationConfig {
  brandName: string;
  primaryColor: string;
  secondaryColor?: string;
  successColor?: string;
  errorColor?: string;
  warningColor?: string;
  informationColor?: string;
  neutralColor?: string;
  accentColor?: string;
  colorNames?: Record<string, string>;
  fontFamily: FontFamilies;
  typographyScale: 'material' | 'system' | 'custom';
  baseFontSize: number;
  baseSpacing: number;
  radiusPreset: RadiusPreset;
  effectsIntensity: EffectsIntensity;
  componentsToGenerate: string[];
  options: GenerationOptions;
}

export interface GenerationOptions {
  includeDarkMode: boolean;
  includeVariants: boolean;
  includeStates: boolean;
  createStyles: boolean;
  createVariables: boolean;
  organizePages: boolean;
  generateFullVariantSets: boolean;
}

export const DEFAULT_CONFIG: GenerationConfig = {
  brandName: 'My Design System',
  primaryColor: '#2563EB',
  // Inter and Roboto Mono are bundled with Figma and resolve in every document
  // without the user installing anything. The previous default was 'Google Sans'
  // and 'Google Sans Code', which are not distributed through Figma's font
  // picker at all — so loadFontAsync rejected for effectively every user and
  // every text node fell back to whatever Figma chose.
  fontFamily: { heading: 'Inter', body: 'Inter', mono: 'Roboto Mono' },
  typographyScale: 'material',
  baseFontSize: 16,
  baseSpacing: 4,
  radiusPreset: 'rounded',
  effectsIntensity: 'medium',
  componentsToGenerate: [],
  options: {
    includeDarkMode: true,
    includeVariants: true,
    includeStates: true,
    createStyles: true,
    createVariables: false,
    organizePages: true,
    generateFullVariantSets: false,
  },
};

// ---- Component definition model (canonical, shared with factory) ----

export interface ComponentVariant {
  name: string;
  properties: Record<string, string | number | boolean>;
}

export interface ComponentState {
  name: string;
  properties: Record<string, string | number | boolean>;
}

export interface ComponentSize {
  name: string;
  properties: Record<string, string | number | boolean>;
}

export interface ComponentDefinition {
  name: string;
  category: ComponentCategory;
  variants: ComponentVariant[];
  states: ComponentState[];
  sizes: ComponentSize[];
  /** Same value domain as a variant's properties — templates read these with String()/Number(). */
  defaultProps: Record<string, string | number | boolean>;
}

// ---- Plugin <-> UI messaging ----
//
// The two sides each declare their own message shape (main.ts for the sandbox,
// ui/plugin.ts for the iframe), because they narrow differently: the sandbox
// validates an untrusted payload, the UI dispatches on a known set of replies.
// The two `payload?: any` interfaces that used to live here had no importers.

export type GenerationStep =
  | 'idle'
  | 'initializing'
  | 'loading-fonts'
  | 'generating-tokens'
  | 'creating-styles'
  | 'creating-pages'
  | 'generating-components'
  | 'organizing'
  | 'complete'
  | 'error';

export interface GenerationProgress {
  step: GenerationStep;
  progress: number;
  message: string;
}

export interface GenerationStats {
  tokensCreated: number;
  stylesCreated: number;
  variablesCreated: number;
  componentsCreated: number;
  pagesCreated: number;
}

export interface GradientStop {
  color: string; // Hex string e.g. #2563EB
  opacity: number; // 0 to 1
  position: number; // 0 to 1
}

export interface GradientPreset {
  id: string;
  name: string;
  description: string;
  type: 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND';
  stops: GradientStop[];
  css: string; // CSS gradient string for UI preview
  monochromeCss: string; // CSS gradient string for monochrome thumbnail preview
}

export interface UsageReport {
  components: { name: string; count: number }[];
  totalInstances: number;
  colorStyles: number;
  textStyles: number;
  effectStyles: number;
  unboundFills: number;
  pages: number;
}

