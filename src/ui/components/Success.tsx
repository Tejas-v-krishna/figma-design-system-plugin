import { useStore, isGenerateBusy } from '../store';
import { destination } from '../destinations';
import { Button } from './controls';
import { useEscape } from '../hooks';
import { CheckCircle2, Download, Search, RefreshCw, X, Loader2 } from 'lucide-react';

export function SuccessOverlay() {
  const stats = useStore((s) => s.stats);
  const statusMessage = useStore((s) => s.statusMessage);
  const setDestination = useStore((s) => s.setDestination);
  const setOverlay = useStore((s) => s.setOverlay);
  const startGeneration = useStore((s) => s.startGeneration);
  const cancelGeneration = useStore((s) => s.cancelGeneration);
  const checkingExisting = useStore((s) => s.checkingExisting);
  const existingSummary = useStore((s) => s.existingSummary);

  // Regenerate can raise the overwrite confirmation on top of this overlay, and
  // that confirmation owns Escape while it is up. Both handlers listening would
  // make one Escape cancel the generate and close this card behind it.
  useEscape(existingSummary === null, () => setOverlay('none'));

  const busy = useStore(isGenerateBusy);

  // Regenerate repeats the destination that produced this card, so it can only
  // offer itself where that destination has something to build. Today every
  // destination that can raise this card has a target; the guard is here so a
  // future one that doesn't gets a disabled button rather than a press that
  // silently does nothing.
  const current = useStore((s) => s.destination);
  const canRebuild = destination(current).target !== undefined;

  // Leaving the card abandons any check Regenerate started. cancelGeneration
  // clears pendingTarget, and existingChecked ignores a reply that arrives with
  // no target — so a late answer can't raise a confirmation dialog over a view
  // the user has already moved on to. Without this the alternative was disabling
  // Close during the check, which traps the user for as long as it runs.
  const leave = (then?: () => void) => () => {
    cancelGeneration();
    setOverlay('none');
    then?.();
  };

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) setOverlay('none');
      }}
    >
      <div className="overlay-card">
        <button
          className="overlay-close-btn"
          onClick={leave()}
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
          <Button onClick={leave(() => setDestination('export'))}>
            <Download size={16} /> Export tokens
          </Button>
          <Button variant="secondary" onClick={leave(() => setDestination('audit'))}>
            <Search size={16} /> Scan usage
          </Button>
          {/* Regenerate keeps the overlay up until the sandbox answers the
              overwrite check. Closing first put the user back on an idle-looking
              panel for the seconds that check takes on a large file, which reads
              as the button having done nothing. confirmGeneration swaps this
              overlay for the progress one. */}
          <Button variant="ghost" onClick={() => startGeneration()} disabled={busy || !canRebuild}>
            {checkingExisting ? (
              <>
                <Loader2 size={16} className="dsk-spin" /> Checking this file…
              </>
            ) : (
              <>
                <RefreshCw size={16} /> Regenerate
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={leave()}>
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
