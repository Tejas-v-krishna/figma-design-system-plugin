// Design System Kit - Plugin Entry Point (Figma API)
import { generateDesignSystem, generateColorExtensions } from './commands/generate';
import { exportTokens, ExportFormat } from './commands/export';
import { scanUsage } from './commands/scan';
import { GenerationConfig } from '../shared/types';

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
      await handleGenerate(msg.payload as GenerationConfig & { target?: string });
      break;
    case 'GENERATE_COLOR_EXTENSIONS':
      await handleGenerateColorExtensions(msg.payload as ColorExtensionsPayload);
      break;
    case 'EXPORT_TOKENS':
      handleExport(msg.payload as { format: ExportFormat; config?: GenerationConfig });
      break;
    case 'SCAN_USAGE':
      await handleScan();
      break;
    case 'LOAD_CONFIG':
      await loadConfig();
      break;
    case 'SAVE_CONFIG':
      try {
        await figma.clientStorage.setAsync(CONFIG_KEY, msg.payload);
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
    const saved = await figma.clientStorage.getAsync(CONFIG_KEY);
    if (saved) {
      figma.ui.postMessage({ type: 'PERSISTED_CONFIG', payload: saved });
      return;
    }
    // Nothing under the current key: migrate anything stored under the old one,
    // then drop it so this only happens once.
    const legacy = await figma.clientStorage.getAsync(LEGACY_CONFIG_KEY);
    if (legacy) {
      await figma.clientStorage.setAsync(CONFIG_KEY, legacy);
      await figma.clientStorage.deleteAsync(LEGACY_CONFIG_KEY);
      figma.ui.postMessage({ type: 'PERSISTED_CONFIG', payload: legacy });
    }
  } catch {
    /* storage unavailable — UI keeps defaults */
  }
}

/** Narrow an unknown thrown value to a message worth showing a user. */
function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}

async function handleGenerateColorExtensions(payload: ColorExtensionsPayload) {
  try {
    figma.ui.postMessage({ type: 'GENERATION_START', payload: { step: 'creating-tokens', progress: 10 } });
    await generateColorExtensions(payload.hex, payload.name, payload.config, payload.customStops);
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: true,
        message: `Shades & Gradients for ${payload.name || payload.hex} generated on canvas!`,
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

async function handleGenerate(config: GenerationConfig & { target?: string }) {
  try {
    figma.ui.postMessage({ type: 'GENERATION_START', payload: { step: 'creating-tokens', progress: 0 } });

    const result = await generateDesignSystem(config, (progress) => {
      figma.ui.postMessage({ type: 'GENERATION_PROGRESS', payload: progress });
    });

    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: true,
        message: 'Design system generated successfully!',
        stats: result.stats,
      },
    });
  } catch (error: unknown) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: errorMessage(error, 'Generation failed'),
      },
    });
  }
}

// Not async: exportTokens is pure, synchronous token serialization. Marking it
// async only made the caller look like it was waiting on I/O that isn't there.
function handleExport(payload: { format: ExportFormat; config?: GenerationConfig }) {
  try {
    // The config travels with the request so export still works on a fresh
    // plugin open, before anything has been generated in this session.
    const tokens = exportTokens(payload.format, payload.config);
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: true, tokens, format: payload.format },
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
    const report = await scanUsage();
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