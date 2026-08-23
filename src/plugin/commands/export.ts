// Design System Kit - Token export command
import { getLastTokens } from '../utils/tokensStore';
import { buildTokens } from '../../shared/build-tokens';
import { DesignTokens, GenerationConfig } from '../../shared/types';
import { toDtcg } from '../../shared/dtcg';

export type ExportFormat = 'json' | 'css' | 'tailwind' | 'dtcg';

/**
 * Serialize the design system's tokens.
 *
 * tokensStore holds tokens in a module-level variable that dies with the plugin
 * sandbox, so on a fresh open there is nothing cached and export used to throw
 * "No design system has been generated yet" even when the user's config was
 * right there in the panel. Tokens are derived deterministically from config, so
 * fall back to rebuilding them instead of failing.
 */
export function exportTokens(format: ExportFormat, config?: GenerationConfig): string {
  const last = getLastTokens();
  const resolved = last ?? (config ? { tokens: buildTokens(config), config } : null);
  if (!resolved) {
    throw new Error('No tokens to export. Configure a design system in the panel first.');
  }
  const { tokens, config: cfg } = resolved;
  switch (format) {
    case 'css':
      return toCss(tokens, cfg);
    case 'tailwind':
      return toTailwind(tokens);
    case 'dtcg':
      return toDtcg(tokens, cfg);
    case 'json':
    default:
      return JSON.stringify(toJson(tokens), null, 2);
  }
}

function toJson(tokens: DesignTokens) {
  return {
    colors: tokens.colors,
    typography: tokens.typography,
    spacing: tokens.spacing,
    shadows: tokens.shadows,
    borderRadius: tokens.borderRadius,
    strokes: tokens.strokes,
  };
}

function colorVars(tokens: DesignTokens): string[] {
  const lines: string[] = [];
  for (const [name, ct] of Object.entries(tokens.colors)) {
    for (const [shade, hex] of Object.entries(ct.shades)) {
      lines.push(`  --color-${name}-${shade}: ${hex};`);
    }
  }
  return lines;
}

/** Dark-mode overrides, or [] when dark mode wasn't generated. */
function darkColorVars(tokens: DesignTokens): string[] {
  const lines: string[] = [];
  for (const [name, ct] of Object.entries(tokens.colors)) {
    if (!ct.darkShades) continue;
    for (const [shade, hex] of Object.entries(ct.darkShades)) {
      lines.push(`    --color-${name}-${shade}: ${hex};`);
    }
  }
  return lines;
}

/**
 * A CSS font stack for one configured family. Families whose names contain
 * anything other than letters, digits and single spaces get quoted, which is
 * what the CSS grammar requires for names like "IBM Plex Mono".
 */
function cssFontStack(family: string, fallback: string): string {
  const quoted = /^[A-Za-z][A-Za-z0-9]*( [A-Za-z0-9]+)*$/.test(family) ? family : JSON.stringify(family);
  return `${quoted}, ${fallback}`;
}

function toCss(tokens: DesignTokens, config: GenerationConfig): string {
  const lines: string[] = [':root {'];
  lines.push('  /* Color */');
  lines.push(...colorVars(tokens));
  lines.push('  /* Typography */');
  lines.push(`  --font-heading: ${cssFontStack(config.fontFamily.heading, 'sans-serif')};`);
  lines.push(`  --font-body: ${cssFontStack(config.fontFamily.body, 'sans-serif')};`);
  lines.push(`  --font-mono: ${cssFontStack(config.fontFamily.mono, 'monospace')};`);
  lines.push('  /* Spacing */');
  for (const s of tokens.spacing) lines.push(`  --space-${s.name}: ${s.value}px;`);
  lines.push('  /* Radius */');
  for (const r of tokens.borderRadius) lines.push(`  --radius-${r.name}: ${r.value};`);
  lines.push('  /* Stroke */');
  for (const s of tokens.strokes) lines.push(`  --stroke-${s.name}: ${s.value}px;`);
  lines.push('  /* Elevation */');
  for (const s of tokens.shadows) lines.push(`  --shadow-${s.name}: ${s.value};`);
  lines.push('}');

  const dark = darkColorVars(tokens);
  if (dark.length) {
    lines.push('');
    lines.push('@media (prefers-color-scheme: dark) {');
    lines.push('  :root {');
    lines.push(...dark);
    lines.push('  }');
    lines.push('}');
  }

  return lines.join('\n');
}

function toTailwind(tokens: DesignTokens): string {
  const colors: Record<string, Record<string, string | Record<string, string>>> = {};
  for (const [name, ct] of Object.entries(tokens.colors)) {
    colors[name] = {};
    for (const [shade, hex] of Object.entries(ct.shades)) colors[name][shade] = hex;
    // Nested keys flatten with dashes in Tailwind, so this yields utilities
    // like `bg-primary-dark-500` alongside `bg-primary-500`.
    if (ct.darkShades) {
      const dark: Record<string, string> = {};
      for (const [shade, hex] of Object.entries(ct.darkShades)) dark[shade] = hex;
      colors[name].dark = dark;
    }
  }
  const spacing: Record<string, string> = {};
  for (const s of tokens.spacing) spacing[s.name] = `${s.value}px`;
  const radius: Record<string, string> = {};
  for (const r of tokens.borderRadius) radius[r.name] = r.value;
  const shadow: Record<string, string> = {};
  for (const s of tokens.shadows) shadow[s.name] = s.value;
  const borderWidth: Record<string, string> = {};
  for (const s of tokens.strokes) borderWidth[s.name] = `${s.value}px`;

  const obj = {
    theme: {
      extend: {
        colors,
        spacing,
        borderRadius: radius,
        borderWidth,
        boxShadow: shadow,
      },
    },
  };
  return `/** Tailwind CSS theme.extend — generated by Design System Kit */\nmodule.exports = ${JSON.stringify(obj, null, 2)};`;
}
