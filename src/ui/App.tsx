import { useEffect } from 'react';
import { useStore } from './store';
import { onPluginMessage } from './plugin';
import { Header } from './components/Header';
import { SetTokensView } from './components/SetTokensView';
import { BuildComponentsView } from './components/BuildComponentsView';
import { CodeExportView } from './components/CodeExportView';
import { AuditView } from './components/AuditView';
import { GeneratingOverlay } from './components/Generating';
import { SuccessOverlay } from './components/Success';
import { ImportPaletteModal } from './components/ImportPaletteModal';
import { OverwriteConfirmModal } from './components/OverwriteConfirmModal';
import { OptionsDrawer } from './components/OptionsDrawer';

export default function App() {
  const view = useStore((s) => s.view);
  const overlay = useStore((s) => s.overlay);
  const lastError = useStore((s) => s.lastError);
  const clearError = useStore((s) => s.clearError);
  const warnings = useStore((s) => s.warnings);
  const clearWarnings = useStore((s) => s.clearWarnings);

  useEffect(() => {
    const off = onPluginMessage((msg) => {
      const st = useStore.getState();
      switch (msg.type) {
        case 'GENERATION_START':
          st.setProgress(msg.payload.progress, 'Starting…');
          break;
        case 'GENERATION_PROGRESS':
          st.setProgress(msg.payload.progress, msg.payload.message);
          break;
        case 'GENERATION_COMPLETE':
          // `?? null` rather than passing it straight through: the sandbox omits
          // `stats` entirely on every failure path and on colour extensions, and
          // the store's field is `GenerationStats | null`.
          st.generationComplete(msg.payload.success, msg.payload.message, msg.payload.stats ?? null);
          if (msg.payload.warnings?.length) st.setWarnings(msg.payload.warnings);
          break;
        case 'SCAN_PROGRESS':
          st.setScanProgress(msg.payload.progress, msg.payload.message);
          break;
        case 'SCAN_COMPLETE':
          st.scanComplete(msg.payload.success, msg.payload.report ?? null, msg.payload.message);
          break;
        case 'EXPORT_COMPLETE':
          st.exportComplete(msg.payload.success, msg.payload.tokens ?? null, msg.payload.message);
          break;
        case 'AVAILABLE_FONTS':
          st.setAvailableFonts(msg.payload);
          break;
        case 'COLOR_SELECTED':
          if (msg.payload.hex) {
            st.setSelectedColor(msg.payload.hex, msg.payload.name ?? undefined);
          }
          break;
        case 'PERSISTED_CONFIG':
          st.hydrateConfig(msg.payload);
          if (msg.warnings?.length) st.setWarnings(msg.warnings);
          break;
        case 'PLUGIN_ERROR':
          st.reportPluginError(msg.payload.message);
          break;
        case 'EXISTING_SUMMARY':
          st.existingChecked(msg.payload);
          break;
      }
    });
    useStore.getState().loadPersisted();
    return off;
  }, []);

  return (
    <div className="dsk-app-shell">
      <Header />
      <main className="dsk-main-content">
        {lastError && (
          <div className="error-banner">
            <span>{lastError}</span>
            <button onClick={clearError} aria-label="Dismiss">×</button>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="dsk-warning-banner" role="status">
            <div className="dsk-warning-banner-body">
              <strong>
                {warnings.length === 1
                  ? 'One saved setting was repaired'
                  : `${warnings.length} saved settings were repaired`}
              </strong>
              <ul>
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
            <button onClick={clearWarnings} aria-label="Dismiss">×</button>
          </div>
        )}
        {(view === 'set-tokens' || view === 'brand' || view === 'typography') && <SetTokensView />}
        {(view === 'build-components' || view === 'components') && <BuildComponentsView />}
        {(view === 'code' || view === 'export') && <CodeExportView />}
        {view === 'scan' && <AuditView />}
      </main>

      {overlay === 'generating' && <GeneratingOverlay />}
      {overlay === 'success' && <SuccessOverlay />}
      <ImportPaletteModal />
      <OverwriteConfirmModal />
      <OptionsDrawer />
    </div>
  );
}

