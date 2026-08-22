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
  //
  // Splitting on whitespace before matching labels means a label and its hex
  // often arrive as two separate tokens ("primary:" then "#2563EB"), so a label
  // is remembered until the next hex rather than having to sit in the same
  // token as its value. Without that, every spaced form advertised above fell
  // through to the bare branch and the hex was assigned to the wrong role.
  const tokens = trimmed.split(/[\s,;]+/).filter(Boolean);
  const out: ParsedPalette = {};
  let bareIdx = 0;
  let pendingKey: keyof ParsedPalette | undefined;

  for (const tok of tokens) {
    // "primary:#2563EB" / "primary=#2563EB" — label and value in one token.
    const inline = /^([a-zA-Z]+)[:=](.+)$/.exec(tok);
    if (inline) {
      const [, label = '', value = ''] = inline;
      const mapped = KEY_MAP[label.toLowerCase()];
      const hex = normalizeHex(value);
      if (mapped && hex) out[mapped] = hex;
      pendingKey = undefined;
      continue;
    }

    // "primary:" or a bare "primary" — a label waiting for the next hex.
    const bareLabel = /^([a-zA-Z]+)[:=]?$/.exec(tok);
    if (bareLabel) {
      const label = bareLabel[1] ?? '';
      pendingKey = KEY_MAP[label.toLowerCase()];
      continue;
    }

    const hex = normalizeHex(tok);
    if (!hex) continue;

    if (pendingKey) {
      out[pendingKey] = hex;
      pendingKey = undefined;
      continue;
    }

    // Unlabeled hexes fill the roles in order, skipping any already claimed by
    // a label so an explicit "error #DC2626" is not overwritten later.
    while (bareIdx < BARE_ORDER.length) {
      const key = BARE_ORDER[bareIdx++];
      if (key && out[key] === undefined) {
        out[key] = hex;
        break;
      }
    }
  }

  if (Object.keys(out).length === 0) return { error: 'No valid #rrggbb colors found.' };
  return { config: out };
}
