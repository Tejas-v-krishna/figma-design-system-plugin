// Design System Kit - Token derivation
//
// Turns a GenerationConfig into a complete DesignTokens tree. Deliberately free
// of any `figma` reference: this is the one function both the canvas generator
// and the exporter need, and keeping it pure means the exporter works on a fresh
// plugin open (when the token cache is empty), the dev harness can produce real
// output outside Figma, and the whole thing is unit-testable.
import { DesignTokens, GenerationConfig } from './types';
import { generateSemanticColors } from './color-utils';
import {
  generateTypographyTokens,
  generateSpacingTokens,
  generateShadowTokens,
  generateBorderRadiusTokens,
  generateStrokeTokens,
} from './typography-utils';

export function buildTokens(config: GenerationConfig): DesignTokens {
  const colors = generateSemanticColors({
    primary: config.primaryColor,
    secondary: config.secondaryColor,
    accent: config.accentColor,
    success: config.successColor,
    error: config.errorColor,
    warning: config.warningColor,
    information: config.informationColor,
    neutral: config.neutralColor,
  });

  let typography = generateTypographyTokens(
    config.fontFamily.body,
    config.baseFontSize,
    config.typographyScale
  );
  // Headings use the heading typeface.
  typography = typography.map((t) =>
    t.group === 'headings' ? { ...t, fontFamily: config.fontFamily.heading } : t
  );

  // Preset handling moved into generateBorderRadiusTokens so the panel can show
  // the same numbers a build will emit without reimplementing the arithmetic.
  const borderRadius = generateBorderRadiusTokens(config.radiusPreset);

  // Intensity scales the ramp rather than trimming names off it — see
  // SHADOW_INTENSITY in typography-utils. Trimming meant a component asking for
  // the `md` step by name lost its shadow at `subtle`, and made `medium` and
  // `strong` produce identical output.
  const shadows = generateShadowTokens(config.effectsIntensity);

  const spacing = generateSpacingTokens(config.baseSpacing);
  const strokes = generateStrokeTokens();

  return { colors, typography, spacing, shadows, borderRadius, strokes };
}
