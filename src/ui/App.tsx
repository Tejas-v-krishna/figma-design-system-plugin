import { useEffect } from 'react';
import { useStore } from './store';
import { onPluginMessage } from './plugin';
import { Header } from './components/Header';
import { SetTokensView } from './components/SetTokensView';
import { BuildComponentsView } from './components/BuildComponentsView';
import { CodeExportView } from './components/CodeExportView';
import { GeneratingOverlay } from './components/Generating';
import { SuccessOverlay } from './components/Success';
import { ImportPaletteModal } from './components/ImportPaletteModal';
import { OptionsDrawer } from './components/OptionsDrawer';

export default function App() {
  const view = useStore((s) => s.view);
  const overlay = useStore((s) => s.overlay);
  const lastError = useStore((s) => s.lastError);
  const clearError = useStore((s) => s.clearError);

  useEffect(() => {
    const off = onPluginMessage((msg) => {
      const st = useStore.getState();
      switch (msg.type) {
        case 'GENERATION_PROGRESS':
          st.setProgress(msg.payload.progress, msg.payload.message);
          break;
        case 'GENERATION_COMPLETE':
          st.generationComplete(msg.payload.success, msg.payload.message, msg.payload.stats);
          break;
        case 'EXPORT_COMPLETE':
          st.exportComplete(msg.payload.success, msg.payload.tokens, msg.payload.message);
          break;
        case 'SCAN_COMPLETE':
          st.scanComplete(msg.payload.success, msg.payload.report, msg.payload.message);
          break;
        case 'AVAILABLE_FONTS':
          st.setAvailableFonts(msg.payload);
          break;
        case 'COLOR_SELECTED':
          if (msg.payload?.hex) {
            st.setSelectedColor(msg.payload.hex, msg.payload.name);
          }
          break;
        case 'PERSISTED_CONFIG':
          st.hydrateConfig(msg.payload);
          break;
      }
    });
    useStore.getState().loadPersisted();
    return off;
  }, []);

  return (
    <div className="figr-app-shell">
      <Header />
      <main className="figr-main-content">
        {lastError && (
          <div className="error-banner">
            <span>{lastError}</span>
            <button onClick={clearError} aria-label="Dismiss">×</button>
          </div>
        )}
        {(view === 'set-tokens' || view === 'brand' || view === 'typography') && <SetTokensView />}
        {(view === 'build-components' || view === 'components') && <BuildComponentsView />}
        {(view === 'code' || view === 'export') && <CodeExportView />}
      </main>

      {overlay === 'generating' && <GeneratingOverlay />}
      {overlay === 'success' && <SuccessOverlay />}
      <ImportPaletteModal />
      <OptionsDrawer />
    </div>
  );
}

