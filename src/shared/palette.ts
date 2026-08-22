// Tolerant palette parser — turns pasted hex lists / JSON into a partial config.
// Framework-agnostic (no Figma imports) so it can be unit-reasoned about anywhere.
import type { GenerationConfig } from './types';

function normalizeHex(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const withHash = t.startsWith('#') ? t : `#${t}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toUpperCase() : null;
}

export interface ParsedPalette {
  primaryColor?: string;
  informationColor?: string;
  successColor?: string;
  warningColor?: string;
  errorColor?: string;
  neutralColor?: string;
}

// Maps user-facing labels (and common aliases) to canonical config keys.
const KEY_MAP: Record<string, keyof ParsedPalette> = {
  primary: 'primaryColor',
  information: 'informationColor',
  info: 'informationColor',
  success: 'successColor',
  warning: 'warningColor',
  warn: 'warningColor',
  error: 'errorColor',
  danger: 'errorColor',
  neutral: 'neutralColor',
  gray: 'neutralColor',
  grey: 'neutralColor',
};

// Order bare hexes are assigned to when no labels are present.
const BARE_ORDER: (keyof ParsedPalette)[] = [
  'primaryColor',
  'informationColor',
  'successColor',
  'warningColor',
  'errorColor',
  'neutralColor',
];

export interface ParseResult {
  config?: Partial<GenerationConfig>;
  error?: string;
}

export function parsePalette(text: string): ParseResult {
  if (!text || !text.trim()) return { error: 'Paste a hex list or JSON to import.' };
  const trimmed = text.trim();

  // JSON form: { "primary": "#2563EB", "neutral": "#64748B" }
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>;
      const out: ParsedPalette = {};
      for (const [k, v] of Object.entries(obj)) {
        const mapped = KEY_MAP[k.toLowerCase()];
        const hex = typeof v === 'string' ? normalizeHex(v) : null;
        if (mapped && hex) out[mapped] = hex;
      }
      if (Object.keys(out).length === 0) return { error: 'No recognized color keys found in JSON.' };
      return { config: out };
    } catch {
      return { error: 'Could not parse that as JSON.' };
    }
  }

  // List form: "#2563EB, neutral #64748B" or "primary: #2563EB" etc.
  const tokens = trimmed.split(/[\s,;]+/).filter(Boolean);
  const out: ParsedPalette = {};
  let bareIdx = 0;
  for (const tok of tokens) {
    const labeled = tok.match(/^([a-zA-Z]+)[:=](.+)$/);
    if (labeled) {
      const mapped = KEY_MAP[labeled[1].toLowerCase()];
      const hex = normalizeHex(labeled[2]);
      if (mapped && hex) out[mapped] = hex;
    } else {
      const hex = normalizeHex(tok);
      if (hex && bareIdx < BARE_ORDER.length) out[BARE_ORDER[bareIdx++]] = hex;
    }
  }
  if (Object.keys(out).length === 0) return { error: 'No valid #rrggbb colors found.' };
  return { config: out };
}
