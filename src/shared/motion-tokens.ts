/**
 * Motion tokens: duration and easing.
 *
 * Durations are named by intent rather than by number, because the number is the
 * thing most likely to be retuned later and every consumer that hardcoded "200"
 * would then be wrong. `base` is the one to reach for when nothing else fits.
 *
 * Easings follow the Material 3 set. The shape matters more than the exact
 * control points: `standard` starts fast and settles slowly, which is what most
 * UI motion wants, because an element that decelerates into place reads as
 * having mass. `linear` is included for a single legitimate use — continuous
 * motion like a spinner or a progress bar, where any easing would read as a
 * stutter on loop.
 */

export interface DurationToken {
  name: string;
  ms: number;
  /** What this duration is for. Shown in the panel and exported as a comment. */
  usage: string;
}

export interface EasingToken {
  name: string;
  /** A CSS timing-function value — valid in Figma's Smart Animate too. */
  value: string;
  usage: string;
}

export const DURATION_TOKENS: DurationToken[] = [
  { name: 'instant', ms: 0, usage: 'No transition. Colour swaps that must not lag the pointer.' },
  { name: 'fast', ms: 100, usage: 'Hover and focus feedback on small controls.' },
  { name: 'quick', ms: 150, usage: 'Checkbox, radio and switch state changes.' },
  { name: 'base', ms: 200, usage: 'The default. Dropdowns, tooltips, tab switches.' },
  { name: 'slow', ms: 300, usage: 'Modals, drawers and anything entering from offscreen.' },
  { name: 'slower', ms: 500, usage: 'Full-page transitions and onboarding sequences.' },
];

export const EASING_TOKENS: EasingToken[] = [
  {
    name: 'standard',
    value: 'cubic-bezier(0.2, 0, 0, 1)',
    usage: 'Default for anything entering, moving or resizing.',
  },
  {
    name: 'decelerate',
    value: 'cubic-bezier(0, 0, 0, 1)',
    usage: 'Elements entering the screen. Fast in, gentle stop.',
  },
  {
    name: 'accelerate',
    value: 'cubic-bezier(0.3, 0, 1, 1)',
    usage: 'Elements leaving the screen. They should not linger.',
  },
  {
    name: 'emphasized',
    value: 'cubic-bezier(0.05, 0.7, 0.1, 1)',
    usage: 'The one moment on a screen you want noticed.',
  },
  {
    name: 'linear',
    value: 'linear',
    usage: 'Continuous motion only — spinners, progress bars.',
  },
];

/** Total motion tokens, for the rail count. */
export const MOTION_TOKEN_COUNT = DURATION_TOKENS.length + EASING_TOKENS.length;
