import { useStore } from '../store';
import { Button } from './controls';
import { useEscape, useFocusOnOpen } from '../hooks';
import { AlertTriangle } from 'lucide-react';

/**
 * Confirms a generate that would change something already in the document.
 *
 * Generating updates same-named styles in place and reuses the generator's own
 * pages, which is the right behaviour — it keeps every layer binding intact
 * instead of orphaning it — but it does overwrite values. That deserves an
 * explicit yes rather than happening on the first click.
 *
 * Shown only when there is something to overwrite. On an empty document the
 * store skips straight to generating, because a confirmation dialog protecting
 * nothing is just an extra click on the plugin's most common action.
 */
export function OverwriteConfirmModal() {
  const summary = useStore((s) => s.existingSummary);
  const confirm = useStore((s) => s.confirmGeneration);
  const cancel = useStore((s) => s.cancelGeneration);

  const confirmRef = useFocusOnOpen<HTMLButtonElement>(summary !== null);
  useEscape(summary !== null, cancel);

  if (!summary) return null;

  const styleTotal = summary.paintStyles + summary.textStyles + summary.effectStyles;
  const counts: string[] = [];
  if (summary.paintStyles > 0) counts.push(`${summary.paintStyles} colour`);
  if (summary.textStyles > 0) counts.push(`${summary.textStyles} text`);
  if (summary.effectStyles > 0) counts.push(`${summary.effectStyles} effect`);

  return (
    <div className="modal-backdrop" onClick={cancel}>
      <div
        className="modal dsk-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dsk-overwrite-title"
      >
        <div className="modal-head">
          <h3 id="dsk-overwrite-title">
            <AlertTriangle size={16} className="dsk-confirm-icon" />
            This file already has a design system
          </h3>
        </div>

        <p className="step-hint" style={{ margin: '0 0 14px' }}>
          Generating will update it in place. Nothing is deleted and no layer loses its
          style — but values that changed will be overwritten.
        </p>

        <ul className="dsk-confirm-list">
          {styleTotal > 0 && (
            <li>
              <strong>{styleTotal.toLocaleString()} styles</strong> will be updated
              {counts.length > 0 && <span className="dsk-confirm-detail"> ({counts.join(', ')})</span>}
            </li>
          )}
          {summary.pages.length > 0 && (
            <li>
              <strong>
                {summary.pages.length} {summary.pages.length === 1 ? 'page' : 'pages'}
              </strong>{' '}
              will be reused
              <span className="dsk-confirm-detail"> ({summary.pages.join(', ')})</span>
            </li>
          )}
        </ul>

        {summary.duplicateStyles > 0 && (
          <p className="dsk-confirm-note">
            {summary.duplicateStyles.toLocaleString()} duplicate{' '}
            {summary.duplicateStyles === 1 ? 'style was' : 'styles were'} left behind by an
            earlier version. They stay where they are — something in your file may be using
            them, and there is no way to tell which copy. Delete them by hand once you have
            checked.
          </p>
        )}

        <div className="modal-actions">
          <Button variant="ghost" onClick={cancel}>Cancel</Button>
          <Button ref={confirmRef} onClick={confirm}>Update the system</Button>
        </div>
      </div>
    </div>
  );
}
