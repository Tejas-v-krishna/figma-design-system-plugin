// Robust font resolution for Figma.
//
// Figma plugins can only use fonts installed in the local Figma instance, and
// style names vary by family ("Semi Bold" for Inter vs "SemiBold" for most
// others). We ask Figma for the fonts that are actually available, then map a
// desired (family, weight) to a concrete installed { family, style } — falling
// back to a guaranteed-available family when the requested one isn't installed.
import { GenerationConfig } from '../../shared/types';

interface FontName {
  family: string;
  style: string;
}

let AVAILABLE: FontName[] = [];
let byFamily: Map<string, string[]> | null = null;

export async function loadAvailableFonts(): Promise<void> {
  const fonts = await figma.listAvailableFontsAsync();
  AVAILABLE = fonts.map((f) => ({ family: f.fontName.family, style: f.fontName.style }));
  byFamily = new Map();
  for (const f of AVAILABLE) {
    const list = byFamily.get(f.family) ?? [];
    list.push(f.style);
    byFamily.set(f.family, list);
  }
}

function findFamily(name: string): string | undefined {
  if (!byFamily) return undefined;
  if (byFamily.has(name)) return name;
  const lower = name.toLowerCase();
  for (const fam of byFamily.keys()) {
    if (fam.toLowerCase() === lower) return fam;
  }
  return undefined;
}

// Candidate style names per weight bucket, best match first. Covers both the
// spaced ("Semi Bold") and unspaced ("SemiBold") conventions.
function nearestStyle(styles: string[], weight: number): string {
  const effectiveWeight = Math.min(weight, 600);
  const order =
    effectiveWeight >= 600
      ? ['SemiBold', 'Semi Bold', 'Medium', 'Regular']
      : effectiveWeight >= 500
      ? ['Medium', 'Regular', 'SemiBold', 'Semi Bold']
      : ['Regular', 'Medium', 'Light'];
  for (const s of order) {
    if (styles.includes(s)) return s;
  }
  return styles[0] ?? 'Regular';
}

// Families Figma resolves in every document without the user installing
// anything. Used as the fallback chain when the requested family is missing,
// in preference to "whatever happens to be installed".
const GUARANTEED_FAMILIES = ['Inter', 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial'];

function firstInstalled(names: string[]): string | undefined {
  for (const n of names) {
    const found = findFamily(n);
    if (found) return found;
  }
  return undefined;
}

/** Resolve a desired font family + numeric weight to an installed { family, style }. */
export function resolveFont(family: string, weight: number): FontName {
  const targetWeight = Math.min(weight, 600);

  if (!byFamily || byFamily.size === 0) {
    const styleName = targetWeight >= 600 ? 'Semi Bold' : targetWeight >= 500 ? 'Medium' : 'Regular';
    return { family: family || 'Inter', style: styleName };
  }

  // The requested family wins. This used to resolve a hardcoded 'Google Sans'
  // *before* the caller's family, so a user who happened to have that family
  // installed got it on every text node regardless of what they configured —
  // and a user who didn't fell through to AVAILABLE[0], i.e. whichever family
  // sorted first alphabetically across their whole font list.
  const fam =
    findFamily(family) ??
    firstInstalled(GUARANTEED_FAMILIES) ??
    AVAILABLE[0]?.family ??
    'Inter';

  return { family: fam, style: nearestStyle(byFamily.get(fam) ?? [], targetWeight) };
}

const LOADED_FONTS = new Set<string>();

/** Load every { family, style } the generator will actually use in parallel with caching. */
export async function preloadFonts(config: GenerationConfig): Promise<void> {
  if (!byFamily) {
    try {
      await loadAvailableFonts();
    } catch {
      /* listing can fail (e.g. offline); resolveFont then falls back safely */
    }
  }
  const families = [
    config.fontFamily.heading,
    config.fontFamily.body,
    config.fontFamily.mono,
    ...GUARANTEED_FAMILIES,
  ];
  const weights = [400, 500, 600, 700];
  const promises: Promise<void>[] = [];

  for (const fam of families) {
    for (const w of weights) {
      const resolved = resolveFont(fam, w);
      const key = `${resolved.family}::${resolved.style}`;
      if (!LOADED_FONTS.has(key)) {
        promises.push(
          figma
            .loadFontAsync(resolved)
            .then(() => {
              LOADED_FONTS.add(key);
            })
            .catch(() => {})
        );
      }
    }
  }
  await Promise.all(promises);
}

/** Distinct available font-family names, for populating the UI dropdowns. */
export function listAvailableFamilies(): string[] {
  return [...new Set(AVAILABLE.map((f) => f.family))].sort();
}

/** Resolve and load a font asynchronously so it can be assigned safely to text nodes. */
export async function ensureFont(family: string, weight: number): Promise<FontName> {
  if (!byFamily || byFamily.size === 0) {
    try {
      await loadAvailableFonts();
    } catch {
      /* ignore */
    }
  }
  const resolved = resolveFont(family, weight);
  const key = `${resolved.family}::${resolved.style}`;
  if (LOADED_FONTS.has(key)) {
    return resolved;
  }

  try {
    await figma.loadFontAsync(resolved);
    LOADED_FONTS.add(key);
    return resolved;
  } catch {
    const fallbacks: FontName[] = [
      { family: 'Inter', style: weight >= 600 ? 'Bold' : 'Regular' },
      { family: 'Roboto', style: weight >= 600 ? 'Bold' : 'Regular' },
      { family: 'Arial', style: weight >= 600 ? 'Bold' : 'Regular' },
    ];
    for (const fb of fallbacks) {
      const fbKey = `${fb.family}::${fb.style}`;
      if (LOADED_FONTS.has(fbKey)) return fb;
      try {
        await figma.loadFontAsync(fb);
        LOADED_FONTS.add(fbKey);
        return fb;
      } catch {
        /* try next */
      }
    }
    return resolved;
  }
}
