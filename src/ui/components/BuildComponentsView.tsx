import React from 'react';
import { useStore } from '../store';
import { COMPONENT_DEFINITIONS } from '../../shared/component-definitions';
import { countComponentsFor } from '../../shared/variant-count';
import { Search, CheckSquare, XSquare, CheckCircle, ChevronUp } from 'lucide-react';

export const BuildComponentsView: React.FC = () => {
  const search = useStore((s) => s.componentSearch);
  const setSearch = useStore((s) => s.setComponentSearch);
  const config = useStore((s) => s.config);
  const toggleComponent = useStore((s) => s.toggleComponent);
  const startGeneration = useStore((s) => s.startGeneration);
  const selectAll = useStore((s) => s.selectAll);

  const selectedSet = new Set(config.componentsToGenerate);
  const allSelected = selectedSet.size === COMPONENT_DEFINITIONS.length;

  const filteredComponents = COMPONENT_DEFINITIONS.filter((comp) =>
    comp.name.toLowerCase().includes(search.toLowerCase()) ||
    comp.category.toLowerCase().includes(search.toLowerCase())
  );

  // How many components each card will actually produce. The rule lives in
  // shared/ so this can't drift from what the factory does.
  const getVariantCount = (comp: typeof COMPONENT_DEFINITIONS[0]) =>
    countComponentsFor(comp, config.options);

  return (
    <div className="figr-build-components-container">
      <div className="figr-components-top-bar">
        <div className="figr-search-wrapper">
          <Search size={16} className="figr-search-icon" />
          <input
            type="text"
            className="figr-search-input"
            placeholder="Search for a component"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="figr-secondary-btn"
          onClick={() => selectAll(!allSelected)}
          title={allSelected ? 'Deselect every component' : 'Select every component'}
        >
          {allSelected ? <XSquare size={15} /> : <CheckSquare size={15} />}
          {allSelected ? 'Clear all' : `Select all ${COMPONENT_DEFINITIONS.length}`}
        </button>
      </div>

      <p className="figr-components-desc">
        Pick the components to generate. Each one is built from your tokens, so
        colors, type, radius and elevation match the system you configured.
      </p>

      <div className="figr-components-count">
        Showing All {filteredComponents.length} Components
      </div>

      <div className="figr-components-grid">
        {filteredComponents.map((comp) => {
          const isSelected = selectedSet.has(comp.name);
          const variants = getVariantCount(comp);

          return (
            <div
              key={comp.name}
              className={`figr-component-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleComponent(comp.name, !isSelected)}
            >
              <div className="figr-card-preview">
                {/* SVG Illustration Placeholder / Component Preview Box */}
                <div className="figr-card-preview-inner">
                  <span className="figr-preview-text">{comp.name[0]}</span>
                </div>
                {isSelected && <CheckCircle size={18} className="figr-card-check" />}
              </div>
              <div className="figr-card-info">
                <span className="figr-card-title">{comp.name}</span>
                <span className="figr-card-variants">
                  {variants} {variants === 1 ? 'variant' : 'variants'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="figr-bottom-bar">
        <div className="figr-credits-badge">
          <span>{selectedSet.size} components selected</span>
        </div>

        <div className="figr-split-action">
          <button className="figr-primary-btn" onClick={() => startGeneration('components')}>
            Generate Components in <span className="figma-icon">❖</span>
          </button>
          <button className="figr-split-caret" onClick={() => startGeneration('components')}>
            <ChevronUp size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
};
