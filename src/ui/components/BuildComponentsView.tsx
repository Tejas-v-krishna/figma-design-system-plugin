import React from 'react';
import { useStore } from '../store';
import { COMPONENT_DEFINITIONS } from '../../shared/component-definitions';
import { Search, Globe, CheckCircle, ChevronUp } from 'lucide-react';

export const BuildComponentsView: React.FC = () => {
  const search = useStore((s) => s.componentSearch);
  const setSearch = useStore((s) => s.setComponentSearch);
  const config = useStore((s) => s.config);
  const toggleComponent = useStore((s) => s.toggleComponent);
  const startGeneration = useStore((s) => s.startGeneration);

  const selectedSet = new Set(config.componentsToGenerate);

  const filteredComponents = COMPONENT_DEFINITIONS.filter((comp) =>
    comp.name.toLowerCase().includes(search.toLowerCase()) ||
    comp.category.toLowerCase().includes(search.toLowerCase())
  );

  // Variant count calculator for preview display
  const getVariantCount = (comp: typeof COMPONENT_DEFINITIONS[0]) => {
    const v = comp.variants.length || 1;
    const s = comp.sizes.length || 1;
    const st = comp.states.length || 1;
    return v * s * st * 4; // Multiplied by combinations
  };

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
        <button className="figr-secondary-btn">
          <Globe size={15} />
          Edit Global Components
        </button>
      </div>

      <p className="figr-components-desc">
        Discover our production-ready UI components, expertly crafted to align with your unique design style.
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
                <span className="figr-card-variants">{variants} Variants</span>
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
