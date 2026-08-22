// Holds the most recently generated tokens + config so the Export and Scan
// commands (separate message handlers) can read them without regenerating.
import { DesignTokens, GenerationConfig } from '../../shared/types';

let last: { tokens: DesignTokens; config: GenerationConfig } | null = null;

export function setLastTokens(tokens: DesignTokens, config: GenerationConfig): void {
  last = { tokens, config };
}

export function getLastTokens(): { tokens: DesignTokens; config: GenerationConfig } | null {
  return last;
}
