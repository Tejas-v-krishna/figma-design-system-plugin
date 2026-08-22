import React, { useEffect, useState } from 'react';
import { useStore, TokenCategory } from '../store';
import { generateColorShades, generateGradientsForColor, hexToHsl, hexToRgb, interpolateOklchStops } from '../../shared/color-utils';
import { getColorName, getNearestColorName } from '../../shared/color-naming';
import { ChevronUp, Sun, Sparkles, Layers, Palette } from 'lucide-react';
import { ColorPickerModal } from './ColorPickerModal';

export const SetTokensView: React.FC = () => {
  const tokenCategory = useStore((s) => s.tokenCategory);
  const setTokenCategory = useStore((s) => s.setTokenCategory);

  const radiusList = useStore((s) => s.radiusList);
  const updateRadiusItem = useStore((s) => s.updateRadiusItem);
  const addRadiusItem = useStore((s) => s.addRadiusItem);

  const strokeList = useStore((s) => s.strokeList);
  const updateStrokeItem = useStore((s) => s.updateStrokeItem);
  const addStrokeItem = useStore((s) => s.addStrokeItem);

  const effectsList = useStore((s) => s.effectsList);
  const updateEffectItem = useStore((s) => s.updateEffectItem);

  const addCustomColorGroup = useStore((s) => s.addCustomColorGroup);

  const storeSelectedColor = useStore((s) => s.selectedColor);
  const setSelectedColor = useStore((s) => s.setSelectedColor);
  const generateColorExtensions = useStore((s) => s.generateColorExtensions);

  const config = useStore((s) => s.config);
  const updateConfig = useStore((s) => s.updateConfig);
  const updateFont = useStore((s) => s.updateFont);
  const startGeneration = useStore((s) => s.startGeneration);

  const [colorNames, setColorNames] = useState<Record<string, string>>({});
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
    const map: Record<string, string> = { ...colorNames };
    for (const hex of hexes) {
      if (!hex) continue;
      const clean = hex.replace('#', '').toUpperCase();
      const name = getColorName(clean);
      map[clean] = name;
      map['#' + clean] = name;
    }
    setColorNames(map);
    updateConfig({ colorNames: map });
  }, [
    config.primaryColor,
    config.secondaryColor,
    config.neutralColor,
    config.successColor,
    config.warningColor,
    config.informationColor,
    config.errorColor,
    config.accentColor,
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
      case 'radius':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Radius</h2>
              <button className="dsk-link-btn" onClick={addRadiusItem}>
                + New radius
              </button>
            </div>
            <div className="dsk-token-group-bar">
              <span>All Radius</span>
              <button className="dsk-icon-add" onClick={addRadiusItem}>+</button>
            </div>
            <div className="dsk-token-rows">
              {radiusList.map((item) => (
                <div className="dsk-token-row" key={item.id}>
                  <span className="dsk-token-name">{item.label}</span>
                  <div className="dsk-token-input-wrapper">
                    <input
                      type="number"
                      className="dsk-token-input"
                      value={item.value}
                      onChange={(e) => updateRadiusItem(item.id, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'stroke':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Stroke</h2>
              <button className="dsk-link-btn" onClick={addStrokeItem}>
                + New stroke
              </button>
            </div>
            <div className="dsk-token-group-bar">
              <span>All Stroke</span>
              <button className="dsk-icon-add" onClick={addStrokeItem}>+</button>
            </div>
            <div className="dsk-token-rows">
              {strokeList.map((item) => (
                <div className="dsk-token-row" key={item.id}>
                  <span className="dsk-token-name">{item.label}</span>
                  <div className="dsk-token-input-wrapper">
                    <input
                      type="number"
                      className="dsk-token-input"
                      value={item.value}
                      onChange={(e) => updateStrokeItem(item.id, Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'effects':
        return (
          <div className="dsk-token-panel">
            <div className="dsk-token-header">
              <h2>Effects</h2>
              <button className="dsk-link-btn">
                + New effects
              </button>
            </div>
            <div className="dsk-token-group-bar">
              <span>All Effects</span>
              <button className="dsk-icon-add">+</button>
            </div>
            <div className="dsk-token-rows">
              {effectsList.map((item) => (
                <div className="dsk-token-row" key={item.id}>
                  <span className="dsk-token-name">{item.label}</span>
                  <div className="dsk-effect-pill">
                    <Sun size={13} className="dsk-effect-icon" />
                    <input
                      type="text"
                      className="dsk-effect-input"
                      value={item.value}
                      onChange={(e) => updateEffectItem(item.id, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

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
                                          const existing = prev[g.id]
                                            ? [...prev[g.id]]
                                            : g.stops.map((s) => s.color);
                                          existing[idx] = newHex;
                                          if (existing.length === 3 && (idx === 0 || idx === 2)) {
                                            const oklchMid = interpolateOklchStops(existing[0], existing[2], 3)[1].color;
                                            existing[1] = oklchMid;
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
          <button className="dsk-primary-btn" onClick={() => startGeneration(tokenCategory)}>
            Create {tokenCategory} variables in <span className="figma-icon">❖</span>
          </button>
          <button className="dsk-split-caret" onClick={() => startGeneration(tokenCategory)}>
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
