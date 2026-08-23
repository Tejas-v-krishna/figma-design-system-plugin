import React from 'react';
import { AlertOctagon } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a render crash anywhere in the panel.
 *
 * Without this, a thrown error inside any view unmounts the whole tree and Figma
 * shows a blank white panel with no text, no controls, and nothing in the UI to
 * say what happened — the plugin looks frozen. A reload is the only recovery
 * available inside an iframe, so the boundary offers it directly rather than
 * leaving the user to close and reopen the plugin.
 *
 * The message is shown verbatim. It is developer-facing text, but a plugin panel
 * has no console the user is likely to open, and a specific string is what makes
 * a bug report actionable.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Goes to the plugin console, which is reachable from Figma's
    // Plugins > Development > Open console.
    console.error('[design-system-kit] panel crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="dsk-crash">
        <AlertOctagon size={30} />
        <h2>The panel hit an error</h2>
        <p>
          Nothing in your Figma file was changed by this. Reloading starts the panel
          over — your saved settings are kept.
        </p>
        <pre className="dsk-crash-detail">{error.message || String(error)}</pre>
        <button className="dsk-primary-btn" onClick={() => window.location.reload()}>
          Reload the panel
        </button>
      </div>
    );
  }
}
