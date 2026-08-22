import { useStore } from '../store';
import { Button } from './controls';
import { Search, Radar } from 'lucide-react';

export function ScanPanel() {
  const result = useStore((s) => s.scanResult);
  const error = useStore((s) => s.scanError);
  const busy = useStore((s) => s.scanBusy);
  const requestScan = useStore((s) => s.requestScan);

  const hasOutput = !!result || !!error;

  return (
    <div>
      <div className="content-header">
        <h2>Usage scan</h2>
        <p className="subtitle">Analyze the current file for component usage, styles, and palette deviations.</p>
      </div>
      <div className="panel">
        <Button onClick={() => requestScan()} disabled={busy}>
          <Search size={16} /> {busy ? 'Scanning…' : 'Run scan'}
        </Button>

        {!hasOutput && (
          <div className="empty-state">
            <Radar size={26} />
            <p>
              Run a scan to count component instances, local styles, and unbound
              fills across the current Figma file.
            </p>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {result && (
          <div className="scan-report">
            <div className="stat-grid">
              <Stat v={result.totalInstances} label="Instances" />
              <Stat v={result.colorStyles} label="Color styles" />
              <Stat v={result.textStyles} label="Text styles" />
              <Stat v={result.effectStyles} label="Effect styles" />
              <Stat v={result.unboundFills} label="Unbound fills" />
              <Stat v={result.pages} label="Pages" />
            </div>

            <h4>Top components</h4>
            <div className="scan-table">
              {result.components.length === 0 && <div className="scan-empty">No component instances found.</div>}
              {result.components.slice(0, 12).map((c) => (
                <div key={c.name} className="scan-row">
                  <span className="scan-name">{c.name}</span>
                  <span className="scan-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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
