import { useState } from 'react';
import { useStore, CATEGORY_GROUPS, BRAND_PRESETS } from '../store';
import { ColorField, FontSelect, SegmentedControl, RangeField } from './controls';
import { Preview } from './Preview';
import { BrandHero } from './Welcome';
import { ChevronRight } from 'lucide-react';

export function BrandView() {
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const applyPreset = useStore((s) => s.applyPreset);

  return (
    <div>
      <BrandHero />

      <div className="card">
        <div className="card-title"><h3>Brand colors</h3></div>
        <label className="field">
          <span className="field-label">Brand name</span>
          <input
            className="text-input"
            value={config.brandName}
            onChange={(e) => updateConfig({ brandName: e.target.value })}
          />
        </label>
        <ColorField label="Primary" value={config.primaryColor} onChange={(v) => updateConfig({ primaryColor: v })} />
        <div className="grid-2">
          <ColorField label="Information" value={config.informationColor ?? '#64748B'} onChange={(v) => updateConfig({ informationColor: v })} />
          <ColorField label="Neutral" value={config.neutralColor ?? '#64748B'} onChange={(v) => updateConfig({ neutralColor: v })} />
        </div>
        <div className="grid-2">
          <ColorField label="Success" value={config.successColor ?? '#10B981'} onChange={(v) => updateConfig({ successColor: v })} />
          <ColorField label="Warning" value={config.warningColor ?? '#F59E0B'} onChange={(v) => updateConfig({ warningColor: v })} />
        </div>
        <ColorField label="Error" value={config.errorColor ?? '#EF4444'} onChange={(v) => updateConfig({ errorColor: v })} />
      </div>

      <div className="card">
        <div className="card-title"><h3>Live preview</h3></div>
        <Preview />
      </div>

      <div className="card">
        <div className="card-title">
          <h3>Start from a preset</h3>
          <span className="step-hint" style={{ margin: 0 }}>One click sets colors &amp; fonts</span>
        </div>
        <div className="preset-grid">
          {BRAND_PRESETS.map((p) => (
            <div key={p.id} className="preset-card" onClick={() => applyPreset(p)}>
              <div className="preset-swatches">
                {[p.colors.primaryColor, p.colors.informationColor, p.colors.successColor, p.colors.warningColor, p.colors.errorColor, p.colors.neutralColor].map((c, i) => (
                  <div key={i} className="preset-swatch" style={{ background: c }} title={c} />
                ))}
              </div>
              <div className="preset-name">{p.name}</div>
              <div className="preset-desc">{p.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TypeView() {
  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const updateFont = useStore((s) => s.updateFont);

  return (
    <div>
      <div className="content-header">
        <h2>Typography &amp; system</h2>
        <p className="subtitle">Set type families and the global scales that drive every token.</p>
      </div>
      <div className="card">
        <FontSelect label="Heading font" kind="heading" value={config.fontFamily.heading} onChange={(v) => updateFont('heading', v)} />
        <FontSelect label="Body font" kind="body" value={config.fontFamily.body} onChange={(v) => updateFont('body', v)} />
        <FontSelect label="Monospace" kind="mono" value={config.fontFamily.mono} onChange={(v) => updateFont('mono', v)} />
        <SegmentedControl
          label="Type scale"
          value={config.typographyScale}
          options={[{ value: 'material', label: 'Material' }, { value: 'system', label: 'System' }, { value: 'custom', label: 'Custom' }]}
          onChange={(v) => updateConfig({ typographyScale: v })}
        />
        <RangeField label="Base font size" value={config.baseFontSize} min={12} max={20} step={1} suffix="px" onChange={(v) => updateConfig({ baseFontSize: v })} />
        <RangeField label="Spacing base" value={config.baseSpacing} min={2} max={8} step={1} suffix="px" onChange={(v) => updateConfig({ baseSpacing: v })} />
        <SegmentedControl
          label="Corner radius"
          value={config.radiusPreset}
          options={[{ value: 'sharp', label: 'Sharp' }, { value: 'rounded', label: 'Rounded' }, { value: 'pill', label: 'Pill' }]}
          onChange={(v) => updateConfig({ radiusPreset: v })}
        />
        <SegmentedControl
          label="Elevation"
          value={config.effectsIntensity}
          options={[{ value: 'none', label: 'None' }, { value: 'subtle', label: 'Subtle' }, { value: 'medium', label: 'Medium' }, { value: 'strong', label: 'Strong' }]}
          onChange={(v) => updateConfig({ effectsIntensity: v })}
        />
      </div>
    </div>
  );
}

export function ComponentsView() {
  const config = useStore((s) => s.config);
  const toggleCategory = useStore((s) => s.toggleCategory);
  const toggleComponent = useStore((s) => s.toggleComponent);
  const selectAll = useStore((s) => s.selectAll);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const total = CATEGORY_GROUPS.reduce((n, g) => n + g.components.length, 0);
  const selectedCount = config.componentsToGenerate.length;
  const allOn = selectedCount === total;

  return (
    <div>
      <div className="content-header">
        <h2>Components</h2>
        <p className="subtitle">Choose which components to generate. Expand a category for per-component control.</p>
      </div>
      <div className="card">
        <div className="card-title">
          <span className="step-hint" style={{ margin: 0 }}>Selected {selectedCount} of {total}</span>
          <button className="link-btn" onClick={() => selectAll(!allOn)}>
            {allOn ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="category-list">
          {CATEGORY_GROUPS.map((g) => {
            const selected = g.components.filter((c) => config.componentsToGenerate.includes(c)).length;
            const on = selected === g.components.length;
            const some = selected > 0 && !on;
            const isOpen = !!expanded[g.category];
            return (
              <div key={g.category}>
                <div className="category-row">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={on}
                      ref={(el) => { if (el) el.indeterminate = some; }}
                      onChange={(e) => toggleCategory(g.category, e.target.checked)}
                    />
                    <span className="category-name">{g.label}</span>
                    <span className="category-count">{selected}/{g.components.length}</span>
                  </label>
                  <button
                    className="category-chev-btn"
                    aria-label={isOpen ? 'Collapse' : 'Expand'}
                    onClick={() => setExpanded((p) => ({ ...p, [g.category]: !p[g.category] }))}
                  >
                    <ChevronRight size={15} className={isOpen ? 'category-chev open' : 'category-chev'} />
                  </button>
                </div>
                {isOpen && (
                  <div className="component-sublist">
                    {g.components.map((c) => (
                      <label key={c} className="component-sub">
                        <input
                          type="checkbox"
                          checked={config.componentsToGenerate.includes(c)}
                          onChange={(e) => toggleComponent(c, e.target.checked)}
                        />
                        <span className="component-sub-name">{c}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
