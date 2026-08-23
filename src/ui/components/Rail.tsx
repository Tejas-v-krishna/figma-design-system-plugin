import React from 'react';
import { Loader2, Palette, Settings2 } from 'lucide-react';
import { useStore, isGenerateBusy } from '../store';
import { TokenCounts } from '../../shared/token-counts';
import { Destination, FOUNDATIONS, LIBRARY, destination } from '../destinations';

/**
 * The instrument rail: all navigation, plus the one Build action.
 *
 * This replaces three separate levels — a header tab bar over four views, a
 * sidebar over seven token scales, and a fixed footer with a Build button per
 * view. Those three could disagree with each other, and did: the sidebar's
 * selection survived a view change, so importing a palette could land you on a
 * list of corner radii. One list of destinations cannot get into that state.
 *
 * Counts arrive as a prop rather than being computed here. `countTokens` runs
 * `buildTokens`, and App needs the same numbers for the sheet head — computing
 * them in both places would build the whole token set twice per keystroke of the
 * hex field.
 */

export const Rail: React.FC<{ counts: TokenCounts }> = ({ counts }) => {
  const current = useStore((s) => s.destination);
  const setDestination = useStore((s) => s.setDestination);
  const config = useStore((s) => s.config);
  const startGeneration = useStore((s) => s.startGeneration);
  const checkingExisting = useStore((s) => s.checkingExisting);
  const generateBusy = useStore(isGenerateBusy);
  const setImportOpen = useStore((s) => s.setImportOpen);
  const setOptionsOpen = useStore((s) => s.setOptionsOpen);

  const active = destination(current);

  // Components is the one destination whose Build has a precondition beyond
  // "not already busy": an empty selection generates an empty page and reports
  // success. The reason is stated in the sheet, since a disabled button in the
  // rail can't explain itself.
  const nothingSelected = current === 'components' && config.componentsToGenerate.length === 0;

  const item = (d: Destination) => {
    const count = d.count?.(counts);
    return (
      <button
        key={d.id}
        type="button"
        className={`dsk-rail-item ${d.id === current ? 'active' : ''}`}
        aria-current={d.id === current ? 'page' : undefined}
        onClick={() => setDestination(d.id)}
      >
        <span className="dsk-rail-item-label">{d.label}</span>
        {count !== undefined && <span className="dsk-rail-count">{count}</span>}
      </button>
    );
  };

  const group = (label: string, items: Destination[]) => (
    <>
      <p className="dsk-rail-group dsk-eyebrow">{label}</p>
      {items.map(item)}
    </>
  );

  return (
    <nav className="dsk-rail" aria-label="Design system">
      <div className="dsk-rail-head">
        <p className="dsk-rail-wordmark">
          Design
          <span>System Kit</span>
        </p>
        {/* Tick and hex together: the first place the panel wears the colour
            being configured, and the one value the rest of the system derives
            from. Not decoration — it moves when the primary colour does. */}
        <div className="dsk-rail-version dsk-data">
          <span className="dsk-rail-tick" aria-hidden="true" />
          <span>{config.primaryColor.toUpperCase()}</span>
        </div>
      </div>

      <div className="dsk-rail-nav">
        {group('Foundations', FOUNDATIONS)}
        {group('Library', LIBRARY)}
      </div>

      <div className="dsk-rail-foot">
        <div className="dsk-rail-total">
          <span className="dsk-eyebrow">Tokens</span>
          <strong>{counts.total}</strong>
        </div>

        {/* No Build where there is nothing to build. Audit and Export own their
            actions inside the sheet, and nothing generates motion tokens at all
            — see the `target` note in ../destinations.ts. */}
        {active.target !== undefined && (
          <button
            type="button"
            className="dsk-build-btn"
            onClick={() => startGeneration()}
            disabled={generateBusy || nothingSelected}
          >
            {checkingExisting ? (
              <>
                <Loader2 size={14} className="dsk-spin" />
                Checking this file…
              </>
            ) : (
              // Named, not just "Build": the rail's Build writes the active
              // destination and only that, so a bare label would read as a
              // whole-system rebuild.
              <>Build {active.label}</>
            )}
          </button>
        )}

        <button
          type="button"
          className="dsk-build-btn"
          style={{
            marginTop: 6,
            background: 'var(--surface-sunk)',
            color: 'var(--text)',
            border: '1px solid var(--hairline)',
            boxShadow: 'none',
            fontSize: '11px',
            padding: '6px 10px',
            fontWeight: 500,
          }}
          onClick={() => startGeneration('all')}
          disabled={generateBusy}
          title="Build all design system pages and token boards on canvas"
        >
          Build Full System ❖
        </button>

        <div className="dsk-rail-icon-row">
          <button
            type="button"
            className="dsk-rail-icon-btn"
            title="Import a palette"
            aria-label="Import a palette"
            onClick={() => setImportOpen(true)}
          >
            <Palette size={15} />
          </button>
          <button
            type="button"
            className="dsk-rail-icon-btn"
            title="Generation options"
            aria-label="Generation options"
            onClick={() => setOptionsOpen(true)}
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
};
