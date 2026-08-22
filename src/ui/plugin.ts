// Thin wrapper around the Figma plugin postMessage protocol.
export function postToPlugin(message: unknown): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

export interface PluginIncoming {
  type: string;
  payload?: any;
}

export function onPluginMessage(handler: (msg: PluginIncoming) => void): () => void {
  const listener = (event: MessageEvent) => {
    const msg = event.data?.pluginMessage;
    if (msg && typeof msg === 'object' && 'type' in msg) {
      handler(msg as PluginIncoming);
    }
  };
  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}
