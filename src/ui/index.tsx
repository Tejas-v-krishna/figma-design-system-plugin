import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
// theme.css comes last on purpose: it re-points the palette variables that
// styles.css declares, and later :root wins on equal specificity.
import './theme.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
