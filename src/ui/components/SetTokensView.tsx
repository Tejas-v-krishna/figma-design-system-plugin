import React, { useEffect, useRef, useState } from 'react';
import { useStore, isGenerateBusy, TokenCategory } from '../store';
import { generateColorShades, generateGradientsForColor, hexToHsl, hexToRgb, interpolateOklchStops } from '../../shared/color-utils';
import {
  generateBorderRadiusTokens,
  generateShadowTokens,
  generateStrokeTokens,
} from '../../shared/typography-utils';
import type { EffectsIntensity, RadiusPreset } from '../../shared/types';
import { getColorName, getNearestColorName } from '../../shared/color-naming';
import { ChevronUp, Sparkles, Layers, Palette, Loader2 } from 'lucide-react';
import { ColorPickerModal } from './ColorPickerModal';

const RADIUS_PRESETS: { value: RadiusPreset; label: string; hint: string }[] = [
  { value: 'sharp', label: 'Sharp', hint: 'Every step flat except full.' },
  { value: 'rounded', label: 'Rounded', hint: 'The full 2–24px geometric ramp.' },
  { value: 'pill', label: 'Pill', hint: 'Every step fully round except none.' },
];

const EFFECT_INTENSITIES: { value: EffectsIntensity; label: string; hint: string }[] = [
  { value: 'none', label: 'None', hint: 'No elevation tokens at all.' },
  { value: 'subtle', label: 'Subtle', hint: 'Tighter geometry, 70% opacity.' },
  { value: 'medium', label: 'Medium', hint: 'The reference ramp.' },
  { value: 'strong', label: 'Strong', hint: 'Longer throw, 130% opacity.' },
];

/**
 * A small light-palette switch, rather than the shared SegmentedControl in
 * controls.tsx. That one is styled off --panel-2/--text-dim/--grad, which are
 * the dark instrument-chrome variables; dropping it into a token panel built on
 * the light specimen sheet puts a dark pill in the middle of white paper.
 */
function PresetSwitch<T extends string>({ value, options, onChange }: {
  value: T;
  options: { value: T; label: string; hint: string }[];
  onChange: (v: T) => void;
}) {
  const active = options.find((o) => o.value === value);
  return (
    <div className="dsk-preset-switch-wrap">
      <div className="dsk-preset-switch" role="radiogroup">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={`dsk-preset-btn ${value === o.value ? 'active' : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {active && <p className="dsk-preset-hint">{active.hint}</p>}
    </div>
  );
}

export const SetTokensView: React.FC = () => {
  const tokenCategory = useStore((s) => s.tokenCategory);
  const setTokenCategory = useStore((s) => s.setTokenCategory);

  const addCustomColorGroup = useStore((s) => s.addCustomColorGroup);

  const storeSelectedColor = useStore((s) => s.selectedColor);
  const setSelectedColor = useStore((s) => s.setSelectedColor);
  const generateColorExtensions = useStore((s) => s.generateColorExtensions);

  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const updateFont = useStore((s) => s.updateFont);
  const startGeneration = useStore((s) => s.startGeneration);
  const checkingExisting = useStore((s) => s.checkingExisting);
  const generateBusy = useStore(isGenerateBusy);

  const [colorNames, setColorNames] = useState<Record<string, string>>(
    () => config.colorNames ?? {}
  );
  // Accumulated hex -> name map. See the naming effect below for why this is a
  // ref and not read off the state it feeds.
  const namesRef = useRef<Record<string, string>>(config.colorNames ?? {});
  const [customStops, setCustomStops] = useState<Record<string, string[]>>({});
  const [activePicker, setActivePicker] = useState<{
    color: string;
    onChange: (newHex: string) => void;
    title?: string;
  } | null>(null);

  const selectedColor = storeSelectedColor || { hex: config.primaryColor || '#2563EB', name: 'Primary' };

  useEffect(() => {
    const hexes = [
      config.primaryColor,
      config.secondaryColor || '#F97316',
      config.neutralColor || '#64748B',
      config.successColor || '#10B981',
      config.warningColor || '#F59E0B',
      config.informationColor || '#06B6D4',
      config.errorColor || '#EF4444',
      config.accentColor || '#8B5CF6',
    ];

    // Naming is synchronous and local, so this no longer needs an async effect
    // or an `active` cancellation guard — there's no in-flight request to race.
    const named: Record<string, string> = {};
    for (const hex of hexes) {
      if (!hex) continue;
      const clean = hex.replace('#', '').toUpperCase();
      const name = getColorName(clean);
      named[clean] = name;
      named['#' + clean] = name;
    }

    // Merged through a ref rather than through the `colorNames` state this
    // effect also writes. Reading that state here would make it a dependency,
    // and an effect that depends on what it sets never settles.
    const merged = { ...namesRef.current, ...named };
    namesRef.current = merged;
    setColorNames(merged);
    updateConfig({ colorNames: merged });
  }, [
    config.primaryColor,
    config.secondaryColor,
    config.neutralColor,
    config.successColor,
    config.warningColor,
    config.informationColor,
    config.errorColor,
    config.accentColor,
    updateConfig,
  ]);

  const categories: { key: TokenCategory; label: string }[] = [
    { key: 'colors', label: 'Colors' },
    { key: 'gradients', label: 'Gradients' },
    { key: 'typography', label: 'Typography' },
    { key: 'spacing', label: 'Spacing' },
    { key: 'radius', label: 'Radius' },
    { key: 'stroke', label: 'Stroke' },
    { key: 'effects', label: 'Effects' },
  ];

  const activeShades = generateColorShades(selectedColor.hex);
  const activeGradients = generateGradientsForColor(selectedColor.hex);
  const activeHsl = hexToHsl(selectedColor.hex);

  const renderContent = () => {
    switch (tokenCategory) {
      case 'radius': {
        // The same call buildTokens makes, so what this panel lists is what a
        // build emits. It used to read a hand-written list in the UI store that
        // nothing downstream consulted: editing a number here changed a row on
        // screen and nothing else, and the names it showed (none, 1…7) were not
        // even the names the exporter wrote.
        const radii = generateBorderRadiusTokens(config.radiusPreset);
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Radius</h2>
              <span className="dsk-token-count">{radii.length} steps</span>
            </div>

            <PresetSwitch
              value={config.radiusPreset}
              options={RADIUS_PRESETS}
              onChange={(radiusPreset) => updateConfig({ radiusPreset })}
            />

            <div className="dsk-token-group-bar">
              <span>Corner scale</span>
              <span className="dsk-token-group-meta">--radius-*</span>
            </div>
            <div className="dsk-token-rows">
              {radii.map((r) => (
                <div className="dsk-token-row" key={r.name}>
                  <span
                    className="dsk-radius-swatch"
                    // Clamped to half the swatch: `full` is 9999px, and asking
                    // for a 9999px corner on a 32px box is the same shape as
                    // asking for 16px. Passed as a custom property because the
                    // rule rounds one corner, not all four.
                    style={{ ['--dsk-corner' as string]: `${Math.min(r.px, 16)}px` }}
                    aria-hidden="true"
                  />
                  <span className="dsk-token-name">{r.name}</span>
                  <code className="dsk-token-value">{r.value}</code>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'stroke': {
        const strokes = generateStrokeTokens();
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Stroke</h2>
              <span className="dsk-token-count">{strokes.length} steps</span>
            </div>

            <p className="dsk-token-note">
              Border widths are a fixed four-step scale — there is no preset to
              choose, so this panel reports rather than edits.
            </p>

            <div className="dsk-token-group-bar">
              <span>Width scale</span>
              <span className="dsk-token-group-meta">--stroke-*</span>
            </div>
            <div className="dsk-token-rows">
              {strokes.map((s) => (
                <div className="dsk-token-row" key={s.name}>
                  <span className="dsk-stroke-swatch" aria-hidden="true">
                    <span style={{ height: s.value }} />
                  </span>
                  <span className="dsk-token-name">{s.name}</span>
                  <code className="dsk-token-value">{s.value}px</code>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'effects': {
        const shadows = generateShadowTokens(config.effectsIntensity);
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Effects</h2>
              <span className="dsk-token-count">
                {shadows.length ? `${shadows.length} steps` : 'no elevation'}
              </span>
            </div>

            <PresetSwitch
              value={config.effectsIntensity}
              options={EFFECT_INTENSITIES}
              onChange={(effectsIntensity) => updateConfig({ effectsIntensity })}
            />

            {shadows.length === 0 ? (
              <div className="dsk-token-empty">
                <p>This system ships no elevation tokens.</p>
                <p className="dsk-token-empty-sub">
                  Nothing is exported and generated components stay flat. Pick
                  another intensity to bring the ramp back.
                </p>
              </div>
            ) : (
              <>
                <div className="dsk-token-group-bar">
                  <span>Elevation ramp</span>
                  <span className="dsk-token-group-meta">--shadow-*</span>
                </div>
                <div className="dsk-token-rows">
                  {shadows.map((s) => (
                    <div className="dsk-token-row dsk-token-row-tall" key={s.name}>
                      {/* The real token string, so the row shows the shadow the
                          exporter writes rather than a stand-in of it. */}
                      <span className="dsk-shadow-plinth" aria-hidden="true">
                        <span className="dsk-shadow-swatch" style={{ boxShadow: s.value }} />
                      </span>
                      <span className="dsk-token-name">{s.name}</span>
                      <code className="dsk-token-value dsk-token-value-wide">{s.value}</code>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      }

      case 'colors': {
        const handleAddColor = () => {
          const name = prompt('Enter new color name (e.g. Purple, Cyan, Brand Accent):');
          if (name) {
            addCustomColorGroup(name, '#8B5CF6');
          }
        };

        const neutShades = generateColorShades(config.neutralColor || '#64748B');

        const handleOpenPicker = (hex: string, label: string, onUpdateHex?: (newHex: string) => void) => {
          setSelectedColor(hex, label);
          setActivePicker({
            color: hex,
            title: label,
            onChange: (newHex) => {
              if (onUpdateHex) {
                onUpdateHex(newHex);
              }
              setSelectedColor(newHex, label);
            },
          });
        };

        const renderColorRow = (
          label: string,
          hex: string,
          onUpdateHex?: (newHex: string) => void
        ) => {
          const cleanHex = hex.replace('#', '').toUpperCase();
          const badge = colorNames[cleanHex] || getNearestColorName(hex);
          const isSelected = storeSelectedColor?.name === label || storeSelectedColor?.hex.toLowerCase() === hex.toLowerCase();

          return (
            <div
              key={label}
              className={`dsk-color-base-row clickable-swatch-row ${isSelected ? 'selected-row' : ''}`}
              onClick={() => handleOpenPicker(hex, label, onUpdateHex)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                cursor: 'pointer',
                background: isSelected ? 'var(--panel-3)' : 'transparent',
                border: isSelected ? '1px solid var(--border-strong)' : '1px solid transparent',
              }}
            >
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)' }}>
                <span>{label}</span>
                {badge && (
                  <span className="dsk-color-name-badge" style={{ fontSize: '11px', opacity: 0.85 }}>
                    {badge}
                  </span>
                )}
              </label>
              <div className="dsk-color-picker-wrap" onClick={(e) => e.stopPropagation()}>
                <div
                  className="dsk-custom-swatch-button"
                  style={{ backgroundColor: hex }}
                  title={`Click to pick color for ${label}`}
                  onClick={() => handleOpenPicker(hex, label, onUpdateHex)}
                />
                <input
                  type="text"
                  className="dsk-token-input text-input"
                  value={hex}
                  onChange={(e) => {
                    if (onUpdateHex) {
                      onUpdateHex(e.target.value);
                    }
                    setSelectedColor(e.target.value, label);
                  }}
                />
              </div>
            </div>
          );
        };

        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Colors</h2>
              <button className="dsk-link-btn" onClick={handleAddColor}>
                + Add another color
              </button>
            </div>

            {/* --- 1. BASE COLORS (PRIMITIVES) --- */}
            <div className="dsk-token-group-bar">
              <span>Base Colors (Primitives)</span>
            </div>
            <div className="dsk-color-base-controls" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {renderColorRow('Primary Color', config.primaryColor || '#2563EB', (h) => updateConfig({ primaryColor: h }))}
              {renderColorRow('Secondary Color', config.secondaryColor || '#F97316', (h) => updateConfig({ secondaryColor: h }))}
              {renderColorRow('Neutral / Grayscale', config.neutralColor || '#64748B', (h) => updateConfig({ neutralColor: h }))}
              {renderColorRow('Accent Color', config.accentColor || '#8B5CF6', (h) => updateConfig({ accentColor: h }))}
            </div>

            {/* --- 2. STATUS & FEEDBACK COLORS (SEMANTICS) --- */}
            <div className="dsk-token-group-bar">
              <span>Status & Feedback Colors (Semantics)</span>
            </div>
            <div className="dsk-color-base-controls" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {renderColorRow('Success / Green', config.successColor || '#10B981', (h) => updateConfig({ successColor: h }))}
              {renderColorRow('Warning / Amber', config.warningColor || '#F59E0B', (h) => updateConfig({ warningColor: h }))}
              {renderColorRow('Error / Red', config.errorColor || '#EF4444', (h) => updateConfig({ errorColor: h }))}
              {renderColorRow('Information / Blue', config.informationColor || '#3B82F6', (h) => updateConfig({ informationColor: h }))}
            </div>

            {/* --- 3. TEXT COLORS (FUNCTIONAL TOKENS) --- */}
            <div className="dsk-token-group-bar">
              <span>Text Colors (Functional Tokens)</span>
            </div>
            <div className="dsk-color-base-controls" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {renderColorRow('Black Text', neutShades[900])}
              {renderColorRow('Description', neutShades[600])}
              {renderColorRow('Additional Text', neutShades[400])}
              {renderColorRow('Disabled Text', neutShades[200])}
              {renderColorRow('White Text', '#FFFFFF')}
            </div>

            {/* --- 4. BACKGROUND & SURFACE COLORS (FUNCTIONAL TOKENS) --- */}
            <div className="dsk-token-group-bar">
              <span>Background & Surface Colors (Functional Tokens)</span>
            </div>
            <div className="dsk-color-base-controls" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
              {renderColorRow('bg-base', '#FFFFFF')}
              {renderColorRow('bg-surface', neutShades[50])}
              {renderColorRow('bg-elevated', '#FFFFFF')}
              {renderColorRow('bg-inset', neutShades[100])}
              {renderColorRow('bg-overlay', neutShades[900])}
            </div>

            {/* --- SHADES & GRADIENTS INSPECTOR PANEL --- */}
            <div className="dsk-inspector-card">
              <div className="dsk-inspector-header">
                <div className="dsk-inspector-title">
                  <div className="dsk-inspector-swatch" style={{ backgroundColor: selectedColor.hex }} />
                  <div>
                    <h3>{selectedColor.name}</h3>
                    <span className="dsk-inspector-subtitle">
                      {selectedColor.hex.toUpperCase()} • HSL({activeHsl.h}°, {activeHsl.s}%, {activeHsl.l}%)
                    </span>
                  </div>
                </div>
                <button
                  className="dsk-generate-ext-btn"
                  onClick={() => generateColorExtensions(selectedColor.hex, selectedColor.name, customStops)}
                >
                  <Sparkles size={14} />
                  <span>Generate Shades & Gradients on Canvas ❖</span>
                </button>
              </div>

              {/* 11 Shades Ramp */}
              <div className="dsk-inspector-section">
                <div className="dsk-section-label">
                  <Layers size={14} />
                  <span>Generated Shades (50 – 950)</span>
                </div>
                <div className="dsk-shades-ramp-grid">
                  {Object.entries(activeShades).map(([shadeKey, hexVal]) => (
                    <div
                      key={shadeKey}
                      className="dsk-shade-thumb-card"
                      onClick={() => handleOpenPicker(hexVal, `${selectedColor.name} ${shadeKey}`)}
                      title={`Click to pick/inspect ${shadeKey}`}
                    >
                      <div className="dsk-shade-preview-box" style={{ backgroundColor: hexVal }} />
                      <div className="dsk-shade-thumb-info">
                        <span className="dsk-shade-thumb-name">{shadeKey}</span>
                        <span className="dsk-shade-thumb-hex">{hexVal.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        );
      }

      case 'gradients':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Gradients</h2>
              <button
                className="dsk-link-btn"
                onClick={() => generateColorExtensions(selectedColor.hex, selectedColor.name, customStops)}
              >
                <Sparkles size={14} /> Generate Gradients on Canvas ❖
              </button>
            </div>

            <div className="dsk-token-group-bar">
              <span>Gradients Suite ({selectedColor.name} Base)</span>
              <span className="dsk-color-name-badge">Dedicated Tab</span>
            </div>

            <div className="dsk-inspector-card">
              <div className="dsk-inspector-header">
                <div className="dsk-inspector-title">
                  <div className="dsk-inspector-swatch" style={{ backgroundColor: selectedColor.hex }} />
                  <div>
                    <h3>{selectedColor.name} Gradients</h3>
                    <span className="dsk-inspector-subtitle">
                      {selectedColor.hex.toUpperCase()} • Dedicated Gradients Workspace (Under Rework)
                    </span>
                  </div>
                </div>
              </div>

              {/* 9 Gradients Suite */}
              <div className="dsk-inspector-section">
                <div className="dsk-section-label">
                  <Palette size={14} />
                  <span>Gradients Suite</span>
                </div>
                <div className="dsk-gradients-grid">
                  {activeGradients.map((g) => {
                    const currentStops = customStops[g.id] || g.stops.map((s) => s.color);
                    const stopsCss = g.stops
                      .map((s, idx) => {
                        const colorHex = currentStops[idx] || s.color;
                        if (s.opacity < 1) {
                          const rgb = hexToRgb(colorHex);
                          const r = Math.round(rgb.r * 255);
                          const g = Math.round(rgb.g * 255);
                          const b = Math.round(rgb.b * 255);
                          return `rgba(${r}, ${g}, ${b}, ${s.opacity}) ${Math.round(s.position * 100)}%`;
                        }
                        return `${colorHex} ${Math.round(s.position * 100)}%`;
                      })
                      .join(', ');

                    let gradientCss = `linear-gradient(135deg, ${stopsCss})`;
                    if (g.type === 'GRADIENT_RADIAL') gradientCss = `radial-gradient(circle at center, ${stopsCss})`;
                    else if (g.type === 'GRADIENT_ANGULAR') gradientCss = `conic-gradient(from 0deg at 50% 50%, ${stopsCss})`;
                    else if (g.type === 'GRADIENT_DIAMOND') gradientCss = `radial-gradient(ellipse at center, ${stopsCss})`;

                    return (
                      <div key={g.id} className="dsk-gradient-card">
                        <div
                          className="dsk-gradient-preview"
                          style={{ background: gradientCss }}
                          title={`${g.name} Color Preview`}
                        />
                        <div className="dsk-gradient-card-info">
                          <span className="dsk-gradient-card-title">{g.name}</span>
                          <span className="dsk-gradient-card-type">{g.description}</span>

                          <div className="dsk-gradient-stops-customizer">
                            {g.stops.map((stop, idx) => {
                              const colorVal = currentStops[idx] || stop.color;
                              return (
                                <div
                                  key={idx}
                                  className="dsk-stop-picker-item"
                                  title={`Click to customize Stop ${idx + 1}: ${colorVal}`}
                                  onClick={() => {
                                    setActivePicker({
                                      color: colorVal,
                                      title: `${g.name} - Stop ${idx + 1}`,
                                      onChange: (newHex) => {
                                        setCustomStops((prev) => {
                                          const existing = [...(prev[g.id] ?? g.stops.map((s) => s.color))];
                                          existing[idx] = newHex;
                                          // Re-derive the midpoint when an end
                                          // stop moves, so a 3-stop ramp stays
                                          // an even ramp. Skipped if the
                                          // interpolator comes back short —
                                          // better a stale midpoint than
                                          // undefined in a gradient.
                                          if (existing.length === 3 && (idx === 0 || idx === 2)) {
                                            const [from, , to] = existing;
                                            if (from && to) {
                                              const mid = interpolateOklchStops(from, to, 3)[1]?.color;
                                              if (mid) existing[1] = mid;
                                            }
                                          }
                                          return { ...prev, [g.id]: existing };
                                        });
                                      },
                                    });
                                  }}
                                >
                                  <div className="dsk-stop-color-swatch-box" style={{ backgroundColor: colorVal }} />
                                  <span className="dsk-stop-hex">{colorVal.toUpperCase()}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'typography':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Typography</h2>
            </div>
            <div className="dsk-color-settings">
              <div className="dsk-color-row">
                <label>Heading Font Family</label>
                <input
                  type="text"
                  className="dsk-token-input text-input"
                  value={config.fontFamily.heading}
                  onChange={(e) => updateFont('heading', e.target.value)}
                />
              </div>
              <div className="dsk-color-row">
                <label>Body Font Family</label>
                <input
                  type="text"
                  className="dsk-token-input text-input"
                  value={config.fontFamily.body}
                  onChange={(e) => updateFont('body', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'spacing':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Spacing</h2>
            </div>
            <div className="dsk-color-settings">
              <div className="dsk-color-row">
                <label>Base Grid Spacing (px)</label>
                <input
                  type="number"
                  className="dsk-token-input"
                  value={config.baseSpacing}
                  onChange={(e) => updateConfig({ baseSpacing: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dsk-set-tokens-container">
      <aside className="dsk-sidebar-subnav">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={`dsk-sidebar-item ${tokenCategory === cat.key ? 'active' : ''}`}
            onClick={() => setTokenCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </aside>

      <main className="dsk-token-main">
        {renderContent()}
      </main>

      <footer className="dsk-bottom-bar">
        <div className="dsk-split-action">
          {/* The press does not start the run — it asks the sandbox what is
              already in the file, and on a large file that answer takes seconds.
              See BuildComponentsView for the same pair. */}
          <button
            className="dsk-primary-btn"
            onClick={() => startGeneration(tokenCategory)}
            disabled={generateBusy}
          >
            {checkingExisting ? (
              <>
                <Loader2 size={15} className="dsk-spin" />
                Checking this file…
              </>
            ) : (
              <>
                Create {tokenCategory} variables in <span className="figma-icon">❖</span>
              </>
            )}
          </button>
          <button
            className="dsk-split-caret"
            onClick={() => startGeneration(tokenCategory)}
            disabled={generateBusy}
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </footer>

      {activePicker && (
        <ColorPickerModal
          color={activePicker.color}
          onChange={activePicker.onChange}
          onClose={() => setActivePicker(null)}
          title={activePicker.title}
        />
      )}
    </div>
  );
};
