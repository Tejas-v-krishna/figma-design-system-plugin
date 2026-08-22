import React from 'react';
import { useStore } from '../store';
import { Headphones, HelpCircle, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);

  return (
    <header className="figr-header">
      <div className="figr-top-announcement-banner">
        <span>Try Figr AI (your design agent that understands your product)</span>
        <span className="banner-arrow">→</span>
      </div>

      <div className="figr-header-top">
        <div className="figr-project-selector">
          <div className="figr-avatar-badge">TK</div>
          <span className="figr-project-title">Untitled</span>
          <ChevronDown size={14} className="figr-project-chevron" />
        </div>

        <div className="figr-header-actions">
          <button className="figr-icon-btn" title="Support">
            <Headphones size={16} />
          </button>
          <button className="figr-icon-btn" title="Help & Docs">
            <HelpCircle size={16} />
          </button>
          <button className="figr-pro-btn">
            Go Pro
          </button>
        </div>
      </div>

      <nav className="figr-header-nav">
        <button
          className={`figr-nav-tab ${view === 'set-tokens' || view === 'brand' || view === 'typography' ? 'active' : ''}`}
          onClick={() => setView('set-tokens')}
        >
          Set Tokens
        </button>
        <button
          className={`figr-nav-tab ${view === 'build-components' || view === 'components' ? 'active' : ''}`}
          onClick={() => setView('build-components')}
        >
          Build Components
        </button>
        <button
          className={`figr-nav-tab ${view === 'code' || view === 'export' ? 'active' : ''}`}
          onClick={() => setView('code')}
        >
          Code
        </button>
      </nav>
    </header>
  );
};
