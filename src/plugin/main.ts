// FIGR Design System - Plugin Entry Point (Figma API)
import { generateDesignSystem, generateColorExtensions } from './commands/generate';
import { exportTokens, ExportFormat } from './commands/export';
import { scanUsage } from './commands/scan';

figma.showUI(__html__, {
  width: 720,
  height: 800,
  themeColors: true,
});

// Selection change listener for canvas color detection
figma.on('selectionchange', () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const node = selection[0];
    let fillHex: string | null = null;
    const colorName: string | null = node.name || null;

    if ('fills' in node && Array.isArray(node.fills) && node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID') {
        const r = Math.round(fill.color.r * 255).toString(16).padStart(2, '0');
        const g = Math.round(fill.color.g * 255).toString(16).padStart(2, '0');
        const b = Math.round(fill.color.b * 255).toString(16).padStart(2, '0');
        fillHex = `#${r}${g}${b}`.toUpperCase();
      }
    }

    if (fillHex) {
      figma.ui.postMessage({
        type: 'COLOR_SELECTED',
        payload: { hex: fillHex, name: colorName },
      });
    }
  }
});

// Tell the UI which font families are actually installed, so its font
// dropdowns only offer fonts Figma can render (the rest silently fail).
(async () => {
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
  payload?: any;
}

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case 'GENERATE_DESIGN_SYSTEM':
      await handleGenerate(msg.payload);
      break;
    case 'GENERATE_COLOR_EXTENSIONS':
      await handleGenerateColorExtensions(msg.payload);
      break;
    case 'EXPORT_TOKENS':
      await handleExport(msg.payload);
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
        /* storage unavailable — non-fatal */
      }
      break;
  }
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

async function handleGenerateColorExtensions(payload: { hex: string; name?: string; config?: any; customStops?: Record<string, string[]> }) {
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
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: error.message || 'Failed to generate shades and gradients',
      },
    });
  }
}

async function handleGenerate(config: any) {
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
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'GENERATION_COMPLETE',
      payload: {
        success: false,
        message: error.message || 'Generation failed',
      },
    });
  }
}

async function handleExport(payload: { format: ExportFormat; config?: any }) {
  try {
    // The config travels with the request so export still works on a fresh
    // plugin open, before anything has been generated in this session.
    const tokens = exportTokens(payload.format, payload.config);
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: true, tokens, format: payload.format },
    });
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'EXPORT_COMPLETE',
      payload: { success: false, message: error.message },
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
  } catch (error: any) {
    figma.ui.postMessage({
      type: 'SCAN_COMPLETE',
      payload: { success: false, message: error.message },
    });
  }
}