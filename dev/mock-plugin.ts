// Dev-only mock of the Figma plugin sandbox.
//
// The real plugin has two isolated contexts that talk over postMessage: the UI
// iframe calls `parent.postMessage({ pluginMessage })`, and the sandbox replies
// with `figma.ui.postMessage(...)`, which the UI receives as a `message` event.
//
// In a standalone browser tab `parent === window`, so the UI's outgoing messages
// land right back on `window`. That means a listener here sees exactly what the
// sandbox would see, and can answer on the same channel. No changes to
// src/ui/plugin.ts are needed, and the UI cannot tell the difference.
//
// Request types (UI -> sandbox) and response types (sandbox -> UI) are disjoint
// sets, so neither side mistakes its own traffic for the other's.
import { GenerationConfig } from '../src/shared/types';
import { exportTokens, ExportFormat } from '../src/plugin/commands/export';
import { COMPONENT_DEFINITIONS } from '../src/shared/component-definitions';
import { countComponentsForAll } from '../src/shared/variant-count';

const STORAGE_KEY = 'dsk.dev.config';

/** Stand-in for figma.listAvailableFontsAsync() — the families most desktops have. */
const MOCK_FONTS = [
  'Arial', 'Courier New', 'Georgia', 'Helvetica', 'Inter', 'Roboto',
  'SF Pro Text', 'Segoe UI', 'Times New Roman', 'Verdana',
];

function reply(type: string, payload?: unknown): void {
  window.postMessage({ pluginMessage: { type, payload } }, '*');
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Mimics generateDesignSystem's progress cadence without touching a canvas. */
async function fakeGenerate(config: GenerationConfig & { target?: string }): Promise<void> {
  const steps: [number, string][] = [
    [5, 'Initializing generation…'],
    [15, 'Fonts loaded'],
    [25, 'Tokens built'],
    [50, 'Pages created'],
    [80, 'Generating components…'],
    [95, 'Finalizing…'],
  ];
  for (const [progress, message] of steps) {
    reply('GENERATION_PROGRESS', { progress, message });
    await wait(220);
  }

  const chosen = config.componentsToGenerate?.length
    ? COMPONENT_DEFINITIONS.filter((d) => config.componentsToGenerate.includes(d.name))
    : COMPONENT_DEFINITIONS;

  reply('GENERATION_COMPLETE', {
    success: true,
    message: `Mock generate finished (target: ${config.target ?? 'all'}). Nothing was drawn — this is the browser harness.`,
    stats: {
      tokensCreated: 214,
      stylesCreated: 186,
      variablesCreated: 214,
      componentsCreated: countComponentsForAll(chosen, config.options),
      pagesCreated: config.target && config.target !== 'all' ? 1 : 5,
    },
  });
}

export function installMockPlugin(): void {
  // The router is separate from the listener so the promise it returns has
  // somewhere to be caught. addEventListener ignores a returned promise, so an
  // async listener that rejects fails silently.
  const route = async (event: MessageEvent) => {
    const msg = event.data?.pluginMessage;
    if (!msg || typeof msg !== 'object' || !('type' in msg)) return;

    switch (msg.type) {
      case 'LOAD_CONFIG': {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            reply('PERSISTED_CONFIG', JSON.parse(raw));
          } catch {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
        reply('AVAILABLE_FONTS', MOCK_FONTS);
        break;
      }

      case 'SAVE_CONFIG':
        localStorage.setItem(STORAGE_KEY, JSON.stringify(msg.payload));
        break;

      case 'EXPORT_TOKENS': {
        // The real exporter, not a stub: export.ts and build-tokens.ts are both
        // Figma-free, so this is the exact output the plugin produces.
        try {
          const { format, config } = msg.payload as { format: ExportFormat; config: GenerationConfig };
          reply('EXPORT_COMPLETE', { success: true, tokens: exportTokens(format, config) });
        } catch (err) {
          reply('EXPORT_COMPLETE', {
            success: false,
            tokens: null,
            message: err instanceof Error ? err.message : 'Export failed',
          });
        }
        break;
      }

      case 'SCAN_USAGE':
        // A scan needs a real document, so this is fixed sample data whose only
        // job is to exercise the Audit view's layout and number formatting.
        await wait(700);
        reply('SCAN_COMPLETE', {
          success: true,
          report: {
            components: [
              { name: 'Button', count: 412 },
              { name: 'Input', count: 173 },
              { name: 'Card', count: 96 },
              { name: 'Badge', count: 64 },
              { name: 'Avatar', count: 51 },
              { name: 'Table Row', count: 38 },
              { name: 'Tooltip', count: 12 },
            ],
            totalInstances: 846,
            colorStyles: 214,
            textStyles: 26,
            effectStyles: 4,
            unboundFills: 1893,
            pages: 7,
          },
        });
        break;

      case 'GENERATE_DESIGN_SYSTEM':
        await fakeGenerate(msg.payload);
        break;

      case 'GENERATE_COLOR_EXTENSIONS':
        await wait(600);
        reply('GENERATION_COMPLETE', {
          success: true,
          message: `Mock shades & gradients for ${msg.payload?.name ?? msg.payload?.hex}.`,
          stats: null,
        });
        break;
    }
  };

  window.addEventListener('message', (event: MessageEvent) => {
    route(event).catch((err: unknown) => {
      console.error('[mock plugin] handler failed:', err);
    });
  });
}
