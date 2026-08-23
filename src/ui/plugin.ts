// Thin wrapper around the Figma plugin postMessage protocol.
import {
  GenerationConfig,
  GenerationProgress,
  GenerationStats,
  GenerationStep,
  UsageReport,
} from '../shared/types';

export function postToPlugin(message: unknown): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

/**
 * Every message the sandbox sends the UI, as a discriminated union.
 *
 * This used to be `{ type: string; payload?: any }`, which meant the App's
 * dispatch could read `msg.payload.progress` off a message that carries no
 * payload at all and the compiler would agree. That is a real crash, not a
 * theoretical one — the sandbox posts several messages with no payload key.
 *
 * Payloads are typed as the sandbox actually sends them, so a field that is
 * absent on the failure path (`stats`, `report`, `tokens`) is optional here and
 * has to be handled. `warnings` rides on the two messages that can carry config
 * repairs.
 */
/** What a generate would overwrite. Mirrors ExistingSummary in the sandbox. */
export interface ExistingSummary {
  pages: string[];
  paintStyles: number;
  textStyles: number;
  effectStyles: number;
  duplicateStyles: number;
  hasAny: boolean;
}

export type PluginIncoming =
  | { type: 'GENERATION_START'; payload: { step: GenerationStep | string; progress: number } }
  | { type: 'GENERATION_PROGRESS'; payload: GenerationProgress }
  | {
      type: 'GENERATION_COMPLETE';
      payload: {
        success: boolean;
        message: string;
        stats?: GenerationStats | null;
        warnings?: string[];
      };
    }
  | { type: 'SCAN_PROGRESS'; payload: { progress: number; message: string } }
  | {
      type: 'SCAN_COMPLETE';
      payload: { success: boolean; report?: UsageReport; message?: string };
    }
  | {
      type: 'EXPORT_COMPLETE';
      payload: { success: boolean; tokens?: string | null; message?: string; format?: string };
    }
  | { type: 'AVAILABLE_FONTS'; payload: string[] }
  // `name` is genuinely nullable here, not merely optional: the sandbox sends
  // `node.name || null` so an unnamed node has an explicit null rather than a
  // missing key.
  | { type: 'COLOR_SELECTED'; payload: { hex?: string; name?: string | null } }
  | { type: 'PERSISTED_CONFIG'; payload: Partial<GenerationConfig>; warnings?: string[] }
  | { type: 'PLUGIN_ERROR'; payload: { message: string } }
  | { type: 'EXISTING_SUMMARY'; payload: ExistingSummary };

export type PluginIncomingType = PluginIncoming['type'];

const INCOMING_TYPES: ReadonlySet<string> = new Set<PluginIncomingType>([
  'GENERATION_START',
  'GENERATION_PROGRESS',
  'GENERATION_COMPLETE',
  'SCAN_PROGRESS',
  'SCAN_COMPLETE',
  'EXPORT_COMPLETE',
  'AVAILABLE_FONTS',
  'COLOR_SELECTED',
  'PERSISTED_CONFIG',
  'PLUGIN_ERROR',
  'EXISTING_SUMMARY',
]);

export function onPluginMessage(handler: (msg: PluginIncoming) => void): () => void {
  const listener = (event: MessageEvent) => {
    const msg: unknown = (event.data as { pluginMessage?: unknown } | null)?.pluginMessage;
    if (typeof msg !== 'object' || msg === null || !('type' in msg)) return;

    const { type } = msg as { type: unknown };
    if (typeof type !== 'string') return;

    // In the browser dev harness the UI's own outgoing messages land back on
    // `window`, because `parent === window` outside an iframe. Requests and
    // replies are disjoint sets, so checking membership here stops the UI from
    // dispatching on its own traffic — and stops an unrecognised type from
    // reaching a `switch` that would read fields off the wrong shape.
    if (!INCOMING_TYPES.has(type)) return;

    handler(msg as PluginIncoming);
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
