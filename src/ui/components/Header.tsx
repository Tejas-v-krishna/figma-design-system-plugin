import React from 'react';
import { useStore } from '../store';
import { Settings2, Palette } from 'lucide-react';

export const Header: React.FC = () => {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const setOptionsOpen = useStore((s) => s.setOptionsOpen);
  const setImportOpen = useStore((s) => s.setImportOpen);

  return (
    <header className="dsk-header">
      <div className="dsk-header-top">
        <span className="dsk-plugin-name">Design System Kit</span>

        <div className="dsk-header-actions">
          <button
            className="figr-icon-btn"
            title="Import a palette"
            aria-label="Import a palette"
            onClick={() => setImportOpen(true)}
          >
            <Palette size={16} />
          </button>
          <button
            className="figr-icon-btn"
            title="Generation options"
            aria-label="Generation options"
            onClick={() => setOptionsOpen(true)}
          >
            <Settings2 size={16} />
          </button>
        </div>
      </div>

      <nav className="dsk-header-nav">
        <button
          className={`dsk-nav-tab ${view === 'set-tokens' || view === 'brand' || view === 'typography' ? 'active' : ''}`}
          onClick={() => setView('set-tokens')}
        >
          Set Tokens
        </button>
        <button
          className={`dsk-nav-tab ${view === 'build-components' || view === 'components' ? 'active' : ''}`}
          onClick={() => setView('build-components')}
        >
          Build Components
        </button>
        <button
          className={`dsk-nav-tab ${view === 'code' || view === 'export' ? 'active' : ''}`}
          onClick={() => setView('code')}
        >
          Code
        </button>
      </nav>
    </header>
  );
};
