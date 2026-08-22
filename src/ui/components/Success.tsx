import { useStore } from '../store';
import { Button } from './controls';
import { useEscape } from '../hooks';
import { CheckCircle2, Download, Search, RefreshCw, X } from 'lucide-react';

export function SuccessOverlay() {
  const stats = useStore((s) => s.stats);
  const statusMessage = useStore((s) => s.statusMessage);
  const setView = useStore((s) => s.setView);
  const setOverlay = useStore((s) => s.setOverlay);
  const startGeneration = useStore((s) => s.startGeneration);

  useEscape(true, () => setOverlay('none'));

  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setOverlay('none'); }}>
      <div className="overlay-card">
        <button
          className="overlay-close-btn"
          onClick={() => setOverlay('none')}
          aria-label="Close"
          title="Close modal"
        >
          <X size={18} />
        </button>

        <CheckCircle2 size={48} className="success-icon" />
        <h2>Design system created</h2>
        <p className="subtitle">{statusMessage}</p>

        {stats && (
          <div className="stat-grid">
            <Stat v={stats.componentsCreated} label="Components" />
            <Stat v={stats.stylesCreated} label="Styles" />
            <Stat v={stats.variablesCreated} label="Variables" />
            <Stat v={stats.pagesCreated} label="Pages" />
            <Stat v={stats.tokensCreated} label="Tokens" />
          </div>
        )}

        <div className="success-actions">
          <Button onClick={() => { setOverlay('none'); setView('export'); }}>
            <Download size={16} /> Export tokens
          </Button>
          <Button variant="secondary" onClick={() => { setOverlay('none'); setView('scan'); }}>
            <Search size={16} /> Scan usage
          </Button>
          <Button variant="ghost" onClick={() => { setOverlay('none'); startGeneration(); }}>
            <RefreshCw size={16} /> Regenerate
          </Button>
          <Button variant="secondary" onClick={() => setOverlay('none')}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ v, label }: { v: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">{v}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
