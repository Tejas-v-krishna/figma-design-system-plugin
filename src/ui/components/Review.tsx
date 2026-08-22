import { useStore, CATEGORY_GROUPS } from '../store';
import { Preview } from './Preview';
import { Button } from './controls';
import { generateColorShades } from '../../shared/color-utils';
import type { GenerationConfig } from '../../shared/types';
import { Wand2, AlertTriangle, Check } from 'lucide-react';

const OPTION_LABELS: { key: keyof GenerationConfig['options']; label: string }[] = [
  { key: 'createStyles', label: 'Figma styles' },
  { key: 'createVariables', label: 'Figma Variables' },
  { key: 'includeDarkMode', label: 'Dark-mode tokens' },
  { key: 'includeVariants', label: 'Variant siblings' },
  { key: 'includeStates', label: 'State siblings' },
  { key: 'generateFullVariantSets', label: 'Full variant sets' },
  { key: 'organizePages', label: 'Organize into pages' },
];

export function ReviewView() {
  const config = useStore((s) => s.config);
  const startGeneration = useStore((s) => s.startGeneration);

  const total = CATEGORY_GROUPS.reduce((n, g) => n + g.components.length, 0);
  const selected = config.componentsToGenerate.length;
  const noneSelected = selected === 0;

  const primary = generateColorShades(config.primaryColor)['500'];
  const enabledOptions = OPTION_LABELS.filter((o) => config.options[o.key]);

  return (
    <div>
      <div className="content-header">
        <h2>Review &amp; generate</h2>
        <p className="subtitle">Confirm the configuration, then generate your design system in one click.</p>
      </div>

      {noneSelected && (
        <div className="error-banner" style={{ borderColor: 'rgba(245, 158, 11, 0.45)', background: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} /> No components selected — pick at least one on the Components step.
          </span>
        </div>
      )}

      <div className="review-grid">
        <section className="card review-card">
          <h3>Brand</h3>
          <div className="review-brand">
            <div className="review-swatch" style={{ background: primary }} />
            <div>
              <div className="review-brand-name">{config.brandName || 'Untitled system'}</div>
              <div className="review-brand-meta">
                {config.fontFamily.heading} / {config.fontFamily.body} / {config.fontFamily.mono}
              </div>
            </div>
          </div>
        </section>

        <section className="card review-card">
          <h3>Typography &amp; system</h3>
          <div className="review-rows">
            <Row k="Type scale" v={cap(config.typographyScale)} />
            <Row k="Base font size" v={`${config.baseFontSize}px`} />
            <Row k="Spacing base" v={`${config.baseSpacing}px`} />
            <Row k="Corner radius" v={cap(config.radiusPreset)} />
            <Row k="Elevation" v={cap(config.effectsIntensity)} />
          </div>
        </section>

        <section className="card review-card">
          <h3>Components</h3>
          <div className="review-rows">
            <Row k="Selected" v={`${selected} of ${total}`} />
            {CATEGORY_GROUPS.map((g) => {
              const n = g.components.filter((c) => config.componentsToGenerate.includes(c)).length;
              if (n === 0) return null;
              return <Row key={g.category} k={g.label} v={`${n}`} />;
            })}
          </div>
        </section>

        <section className="card review-card">
          <h3>Options</h3>
          {enabledOptions.length === 0 ? (
            <div className="review-empty">No generation options enabled.</div>
          ) : (
            <div className="chip-wrap">
              {enabledOptions.map((o) => (
                <span key={o.key} className="chip-soft"><Check size={12} /> {o.label}</span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-title"><h3>Live preview</h3></div>
        <Preview />
      </section>

      <div className="review-generate">
        <Button onClick={startGeneration} disabled={noneSelected} style={{ width: '100%' }}>
          <Wand2 size={17} /> Generate design system
        </Button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="review-row">
      <span className="review-key">{k}</span>
      <span className="review-val">{v}</span>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
