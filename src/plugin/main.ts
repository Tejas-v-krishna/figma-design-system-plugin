// Design System Kit - Plugin Entry Point (Figma API)
import { generateDesignSystem, generateColorExtensions } from './commands/generate';
import { exportTokens, ExportFormat } from './commands/export';
import { scanUsage } from './commands/scan';
import { summarizeExisting } from './commands/existing';
import { GenerationConfig } from '../shared/types';
import { sanitizeConfig } from '../shared/config-schema';

interface ColorExtensionsPayload {
  hex: string;
  name?: string;
  config?: GenerationConfig;
  customStops?: Record<string, string[]>;
}

figma.showUI(__html__, {
  width: 720,
  height: 800,
  themeColors: true,
});

// Selection change listener for canvas color detection
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  // Only a single node gives an unambiguous colour to offer the UI.
  if (selection.length !== 1) return;
  const node = selection[0];
  if (!node) return;

  const hex = solidFillHex(node);
  if (!hex) return;
  figma.ui.postMessage({
    type: 'COLOR_SELECTED',
    payload: { hex, name: node.name || null },
  });
});

/**
 * Hex of a node's first fill, if that fill is a plain solid colour.
 *
 * `'fills' in node` is the only way to ask, because a fill-less node type has no
 * such property at all. The paint is then narrowed by tag rather than accessed
 * through an `any`: a gradient paint has no `.color`, so reading `.color.r` off
 * one throws, and Array.isArray on `node.fills` widens the element type to `any`
 * and hides exactly that.
 */
function solidFillHex(node: SceneNode): string | null {
  if (!('fills' in node)) return null;
  const fills = node.fills;
  if (fills === figma.mixed || !Array.isArray(fills)) return null;
  const paint: Paint | undefined = fills[0];
  if (!paint || paint.type !== 'SOLID') return null;

  const channel = (n: number) =>
    Math.round(Math.min(1, Math.max(0, n)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(paint.color.r)}${channel(paint.color.g)}${channel(paint.color.b)}`.toUpperCase();
}

// Tell the UI which font families are actually installed, so its font
// dropdowns only offer fonts Figma can render (the rest silently fail).
void (async () => {
  try {
    const fonts = await figma.listAvailableFontsAsync();
    const names = [...new Set(fonts.map((f) => f.fontName.family))].sort();
    figma.ui.postMessage({ type: 'AVAILABLE_FONTS', payload: names });
  } catch {
    /* UI keeps its static fallback font list */
  }
})();

interface PluginMessage {
  type: string;
  payload?: unknown;
}

/**
 * Route one message from the UI.
 *
 * Split out from the `onmessage` assignment below so the promise it returns has
 * somewhere to be caught. Assigning an async function directly to `onmessage`
 * meant any rejection became an unhandled rejection, which Figma reports in no
 * console the user can see — the panel would simply sit there.
 */
async function route(msg: PluginMessage): Promise<void> {
  switch (msg.type) {
    case 'GENERATE_DESIGN_SYSTEM':
      await handleGenerate(msg.payload);
      break;
    case 'GENERATE_COLOR_EXTENSIONS':
      await handleGenerateColorExtensions(msg.payload);
      break;
    case 'EXPORT_TOKENS':
      handleExport(msg.payload);
      break;
    case 'SCAN_USAGE':
      await handleScan();
      break;
    case 'CHECK_EXISTING':
      await handleCheckExisting();
      break;
    case 'LOAD_CONFIG':
      await loadConfig();
      break;
    case 'SAVE_CONFIG':
      try {
        // Sanitized on the way in as well as on the way out, so a bad value can
        // never be persisted in the first place — otherwise it would come back
        // on every subsequent open and be repaired every time.
        await figma.clientStorage.setAsync(CONFIG_KEY, sanitizeConfig(msg.payload).config);
      } catch {
        /* storage unavailable — non-fatal, the UI keeps its in-memory config */
      }
      break;
    default:
      // Previously fell through silently, so a typo'd message type — or a UI
      // built against a newer plugin — looked exactly like a hang.
      console.warn(`[design-system-kit] ignoring unknown message type: ${msg.type}`);
  }
}

figma.ui.onmessage = (msg: PluginMessage) => {
  route(msg).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[design-system-kit] unhandled error handling', msg.type, error);
    figma.ui.postMessage({
      type: 'PLUGIN_ERROR',
      payload: { message: `Something went wrong handling ${msg.type}: ${message}` },
    });
  });
};

const CONFIG_KEY = 'dsk.config';
/** Pre-rename key. Read once so existing users don't lose their saved config. */
const LEGACY_CONFIG_KEY = 'figr.config';

async function loadConfig(): Promise<void> {
  try {
    const saved: unknown = await figma.clientStorage.getAsync(CONFIG_KEY);
    if (saved) {
      postPersistedConfig(saved);
      return;
    }
    // Nothing under the current key: migrate anything stored under the old one,
    // then drop it so this only happens once.
    const legacy: unknown = await figma.clientStorage.getAsync(LEGACY_CONFIG_KEY);
    if (legacy) {
      const { config } = sanitizeConfig(legacy);
      await figma.clientStorage.setAsync(CONFIG_KEY, config);
      await figma.clientStorage.deleteAsync(LEGACY_CONFIG_KEY);
      postPersistedConfig(legacy);
    }
  } catch {
    /* storage unavailable — UI keeps defaults */
  }
}

/**
 * Hand a stored config to the UI, repaired if it needed it.
 *
 * The repair list travels with it rather than being swallowed, because a config
 * that quietly loses the user's font choice on load is the exact kind of silent
 * failure that reads as "the plugin forgot my settings".
 */
function postPersistedConfig(saved: unknown): void {
  const { config, repairs } = sanitizeConfig(saved);
  if (repairs.length > 0) {
    console.warn('[design-system-kit] repaired saved config:', repairs.join('; '));
  }
  figma.ui.postMessage({ type: 'PERSISTED_CONFIG', payload: config, warnings: repairs });
}

/** Narrow an unknown thrown value to a message worth showing a user. */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

/**
 * Read the shades-and-gradients request off an untrusted payload.
 *
 * Returns null when there is no usable colour in it. `hex` was previously read
 * straight through to `baseHex.replace('#','')`, which throws on a non-string —
 * and the throw surfaced as a bare "replace is not a function", naming neither
 * the field nor the command.
 */
function readColorExtensionsPayload(payload: unknown): ColorExtensionsPayload | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.hex !== 'string' || !/^#?[0-9a-fA-F]{6}$/.test(raw.hex.trim())) return null;

  const trimmed = raw.hex.trim();
  const stops: Record<string, string[]> = {};
  if (typeof raw.customStops === 'object' && raw.customStops !== null) {
    for (const [key, value] of Object.entries(raw.customStops as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        stops[key] = value.filter((c): c is string => typeof c === 'string');
      }
    }
  }

  return {
    hex: (trimmed.startsWith('#') ? trimmed : `#${trimmed}`).toUpperCase(),
    name: typeof raw.name === 'string' && raw.name ? raw.name : undefined,
    config: raw.config === undefined ? undefined : sanitizeConfig(raw.config).config,
    customStops: Object.keys(stops).length > 0 ? stops : undefined,
  };
}

async function handleGenerateColorExtensions(payload: unknown) {
  const request = readColorExtensionsPayload(payload);
  if (!request) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: 'Pick a colour first — that request had no valid hex value in it.',
      },
    });
    return;
  }

  try {
    figma.ui.postMessage({ type: 'GENERATION_START', payload: { step: 'creating-tokens', progress: 10 } });
    await generateColorExtensions(request.hex, request.name, request.config, request.customStops);
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: true,
        message: `Shades & Gradients for ${request.name ?? request.hex} generated on canvas!`,
      },
    });
  } catch (error: unknown) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: errorMessage(error, 'Failed to generate shades and gradients'),
      },
    });
  }
}

/**
 * The optional generation target, which rides alongside the config rather than
 * living in it: it selects *what* to build ('all', 'tokens', a board name), not
 * how, so it is a property of the request and not of the user's saved system.
 */
function readTarget(payload: unknown): string | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;
  const target = (payload as { target?: unknown }).target;
  return typeof target === 'string' && target ? target : undefined;
}

async function handleGenerate(payload: unknown) {
  const { config, repairs } = sanitizeConfig(payload);
  const target = readTarget(payload);
  if (repairs.length > 0) {
    console.warn('[design-system-kit] repaired incoming config:', repairs.join('; '));
  }

  try {
    figma.ui.postMessage({ type: 'GENERATION_START', payload: { step: 'creating-tokens', progress: 0 } });

    const result = await generateDesignSystem({ ...config, target }, (progress) => {
      figma.ui.postMessage({ type: 'GENERATION_PROGRESS', payload: progress });
    });

    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: true,
        message: 'Design system generated successfully!',
        stats: result.stats,
        warnings: repairs,
      },
    });
  } catch (error: unknown) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: errorMessage(error, 'Generation failed'),
        warnings: repairs,
      },
    });
  }
}

const EXPORT_FORMATS: readonly ExportFormat[] = ['json', 'dtcg', 'css', 'tailwind'];

// Not async: exportTokens is pure, synchronous token serialization. Marking it
// async only made the caller look like it was waiting on I/O that isn't there.
function handleExport(payload: unknown) {
  const raw = typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
  const format = EXPORT_FORMATS.find((f) => f === raw.format);
  if (!format) {
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: false, message: `Unknown export format "${String(raw.format)}".` },
    });
    return;
  }

  // The config travels with the request so export still works on a fresh
  // plugin open, before anything has been generated in this session. It stays
  // optional: exportTokens raises a specific "configure a design system first"
  // error when there is neither a generated token set nor a config, and
  // substituting defaults here would replace that message with a silent export
  // of a design system the user never asked for.
  const config = raw.config === undefined ? undefined : sanitizeConfig(raw.config).config;

  try {
    const tokens = exportTokens(format, config);
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: true, tokens, format },
    });
  } catch (error: unknown) {
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: false, message: errorMessage(error, 'Export failed') },
    });
  }
}

async function handleScan() {
  try {
    const report = await scanUsage((p) => {
      figma.ui.postMessage({ type: 'SCAN_PROGRESS', payload: p });
    });
    figma.ui.postMessage({
      type: 'SCAN_COMPLETE',
      payload: { success: true, report },
    });
  } catch (error: unknown) {
    figma.ui.postMessage({
      type: 'SCAN_COMPLETE',
      payload: { success: false, message: errorMessage(error, 'Scan failed') },
    });
  }
}

/**
 * Tell the UI what a generate would overwrite, so it can ask first.
 *
 * On failure this reports "nothing found" rather than an error. The check exists
 * to add a confirmation step, and a broken check should not be able to block the
 * user from generating at all — the worst case is the old behaviour, which is
 * overwriting without asking, and that is better than a plugin that refuses to
 * run because it could not read the style list.
 */
async function handleCheckExisting() {
  try {
    figma.ui.postMessage({ type: 'EXISTING_SUMMARY', payload: await summarizeExisting() });
  } catch (error: unknown) {
    console.warn('[design-system-kit] could not check for existing styles:', error);
    figma.ui.postMessage({
      type: 'EXISTING_SUMMARY',
      payload: {
        pages: [],
        paintStyles: 0,
        textStyles: 0,
        effectStyles: 0,
        duplicateStyles: 0,
        hasAny: false,
      },
    });
  }
}