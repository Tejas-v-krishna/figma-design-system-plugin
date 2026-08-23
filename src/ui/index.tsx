import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';
// theme.css comes last on purpose: it re-points the palette variables that
// styles.css declares, and later :root wins on equal specificity.
import './theme.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
} else {
  // Only reachable if the built HTML shell loses its mount point. Rendering
  // nothing would leave a blank panel with no clue why, so say it out loud.
  document.body.innerHTML =
    '<p style="font-family:sans-serif;padding:24px;line-height:1.6">' +
    'Design System Kit could not start: the panel is missing its mount point. ' +
    'Reinstall the plugin from a fresh build.</p>';
}
