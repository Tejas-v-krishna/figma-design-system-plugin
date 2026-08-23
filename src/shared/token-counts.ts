import { GenerationConfig } from './types';
import { buildTokens } from './build-tokens';
import { generateGradientsForColor } from './color-utils';
import { MOTION_TOKEN_COUNT } from './motion-tokens';

/**
 * How many tokens each foundation actually contains, for the rail.
 *
 * Derived from buildTokens rather than estimated, so the counts shown next to
 * each rail item are exactly what a build will emit. That matters: the rail is
 * the only place the user sees the size of their system before committing it, so
 * a number that drifts from reality is worse than no number.
 */

export interface TokenCounts {
  colors: number;
  colorFamilies: number;
  gradients: number;
  typography: number;
  spacing: number;
  radius: number;
  stroke: number;
  elevation: number;
  motion: number;
  total: number;
}

/** Shades per colour family — 50 through 950. */
export const SHADES_PER_FAMILY = 11;

export function countTokens(config: GenerationConfig): TokenCounts {
  const tokens = buildTokens(config);

  const colorFamilies = Object.keys(tokens.colors).length;
  const colors = colorFamilies * SHADES_PER_FAMILY;

  const counts = {
    colors,
    colorFamilies,
    // Derived from the same function the sandbox counts with (generate.ts, the
    // gradients target) rather than a constant, so the two can't drift.
    gradients: generateGradientsForColor(config.primaryColor).length,
    typography: tokens.typography.length,
    spacing: tokens.spacing.length,
    radius: tokens.borderRadius.length,
    stroke: tokens.strokes.length,
    elevation: tokens.shadows.length,
    motion: MOTION_TOKEN_COUNT,
  };

  return {
    ...counts,
    // colorFamilies is a breakdown of `colors`, not an addition to it.
    //
    // motion is excluded too, and for a stronger reason: this function promises
    // the counts are what a build emits, and nothing emits motion yet. It is not
    // in buildTokens and no exporter touches it, so folding it into the total
    // would overstate the system by 11 tokens. The per-foundation count above
    // still reports it — the Motion sheet says outright that those are reference
    // values — but the total stays honest. Fold it in when motion reaches
    // buildTokens.
    total:
      counts.colors +
      counts.gradients +
      counts.typography +
      counts.spacing +
      counts.radius +
      counts.stroke +
      counts.elevation,
  };
}
