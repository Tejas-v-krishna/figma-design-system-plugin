import React from 'react';
import { useStore } from '../store';
import { Radar, RefreshCw } from 'lucide-react';

export const AuditView: React.FC = () => {
  const result = useStore((s) => s.scanResult);
  const busy = useStore((s) => s.scanBusy);
  const requestScan = useStore((s) => s.requestScan);

  return (
    <div className="dsk-audit-container">
      <div className="dsk-token-header">
        <h2>Audit</h2>
        <button className="dsk-secondary-btn" onClick={() => requestScan()} disabled={busy}>
          <RefreshCw size={15} className={busy ? 'dsk-spin' : undefined} />
          {busy ? 'Scanning…' : result ? 'Re-scan' : 'Run scan'}
        </button>
      </div>

      <p className="dsk-components-desc">
        Reads every page in this file and reports what it finds: how many
        component instances are in use, how many local styles exist, and how much
        colour is applied directly instead of through a style.
      </p>

      {!result && !busy && (
        <div className="dsk-audit-empty">
          <Radar size={30} />
          <p>
            Nothing scanned yet. A scan reads the whole document, so it can take a
            few seconds on a large file.
          </p>
        </div>
      )}

      {result && (
        <>
          <div className="dsk-token-group-bar">Summary</div>
          <div className="dsk-stat-grid">
            <Stat v={result.pages} label="Pages" />
            <Stat v={result.totalInstances} label="Instances" />
            <Stat v={result.components.length} label="Components used" />
            <Stat v={result.colorStyles} label="Colour styles" />
            <Stat v={result.textStyles} label="Text styles" />
            <Stat v={result.effectStyles} label="Effect styles" />
          </div>

          <div className="dsk-token-group-bar">Most used components</div>
          {result.components.length === 0 ? (
            <div className="dsk-audit-note">
              No component instances found in this file.
            </div>
          ) : (
            <div className="dsk-audit-table">
              {result.components.slice(0, 15).map((c) => (
                <div key={c.name} className="dsk-audit-row">
                  <span className="dsk-audit-row-name">{c.name}</span>
                  <span className="dsk-audit-row-count">{c.count}</span>
                </div>
              ))}
              {result.components.length > 15 && (
                <div className="dsk-audit-note">
                  …and {result.components.length - 15} more.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const Stat: React.FC<{ v: number; label: string }> = ({ v, label }) => (
  <div className="dsk-stat">
    <div className="dsk-stat-value">{v.toLocaleString()}</div>
    <div className="dsk-stat-label">{label}</div>
  </div>
);
