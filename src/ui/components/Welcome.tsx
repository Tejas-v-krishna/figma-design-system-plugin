import { useStore } from '../store';
import { Button } from './controls';
import { Sparkles, Upload } from 'lucide-react';

export function BrandHero() {
  const setImportOpen = useStore((s) => s.setImportOpen);
  return (
    <div className="hero">
      <div className="hero-mark"><Sparkles size={26} /></div>
      <div>
        <h1>FIGR Design System</h1>
        <p className="subtitle">
          Generate a complete, on-brand design system in Figma — tokens, components, and styles in one click.
        </p>
        <div className="hero-actions">
          <Button onClick={() => setImportOpen(true)}>
            <Upload size={15} /> Import existing palette
          </Button>
        </div>
      </div>
    </div>
  );
}
