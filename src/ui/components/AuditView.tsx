import React from 'react';
import { useStore } from '../store';
import { Radar, RefreshCw, AlertTriangle } from 'lucide-react';

export const AuditView: React.FC = () => {
  const result = useStore((s) => s.scanResult);
  const busy = useStore((s) => s.scanBusy);
  const progress = useStore((s) => s.scanProgress);
  const message = useStore((s) => s.scanMessage);
  const requestScan = useStore((s) => s.requestScan);

  return (
    <div className="dsk-audit-container">
      <div className="dsk-token-header">
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

      {/* A scan walks every node on every page, which is seconds on a large
          file. The button's spinner alone left it looking hung, so this reports
          the sandbox's own progress — including which page it is on. */}
      {busy && (
        <div className="dsk-audit-progress">
          <div className="dsk-audit-progress-head">
            <span>{message || 'Scanning…'}</span>
            <span className="dsk-audit-progress-pct">{progress}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

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

          {/* The scan has always counted these and never shown them, despite the
              description above promising it. */}
          <div className="dsk-token-group-bar">Unbound colour</div>
          {result.unboundFills === 0 ? (
            <div className="dsk-audit-note">
              Every solid fill in this file comes from a colour style. Nothing to fix.
            </div>
          ) : (
            <div className="dsk-audit-flag">
              <AlertTriangle size={16} />
              <div>
                <strong>{result.unboundFills.toLocaleString()} solid fills</strong> are
                painted directly instead of through a colour style. Rebinding them is
                what makes a palette change propagate — right now those layers would
                keep their old colour.
              </div>
            </div>
          )}

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
