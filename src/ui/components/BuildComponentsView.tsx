import React from 'react';
import { useStore } from '../store';
import { COMPONENT_DEFINITIONS } from '../../shared/component-definitions';
import { countComponentsFor } from '../../shared/variant-count';
import { Search, SearchX, CheckSquare, XSquare, CheckCircle } from 'lucide-react';

export const BuildComponentsView: React.FC = () => {
  const search = useStore((s) => s.componentSearch);
  const setSearch = useStore((s) => s.setComponentSearch);
  const config = useStore((s) => s.config);
  const toggleComponent = useStore((s) => s.toggleComponent);
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

  // The number of Figma components the run will actually create, which is what
  // the options in the drawer change — the selection count alone doesn't show
  // that turning on full variant sets multiplies the work several times over.
  const totalVariants = COMPONENT_DEFINITIONS.filter((c) => selectedSet.has(c.name)).reduce(
    (sum, c) => sum + getVariantCount(c),
    0,
  );

  return (
    <div className="dsk-build-components-container">
      <div className="dsk-components-top-bar">
        <div className="dsk-search-wrapper">
          <Search size={16} className="dsk-search-icon" />
          <input
            type="text"
            className="dsk-search-input"
            placeholder="Search for a component"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className="dsk-secondary-btn"
          onClick={() => selectAll(!allSelected)}
          title={allSelected ? 'Deselect every component' : 'Select every component'}
        >
          {allSelected ? <XSquare size={15} /> : <CheckSquare size={15} />}
          {allSelected ? 'Clear all' : `Select all ${COMPONENT_DEFINITIONS.length}`}
        </button>
      </div>

      <div className="dsk-components-count">
        {/* Was "0 components selected" in a footer next to an enabled Generate
            button. The run then built an empty page and reported success, so the
            only honest options were to explain or to disable — this does both,
            with the rail's Build disabled to match. It reads here rather than in
            the footer because the footer is gone: the rail owns the action, and a
            disabled button in the rail cannot explain its own precondition. */}
        {selectedSet.size === 0
          ? 'Select at least one component to build.'
          : `${selectedSet.size} of ${COMPONENT_DEFINITIONS.length} selected · ${totalVariants} variants`}
        {search && ` · ${filteredComponents.length} match “${search}”`}
      </div>

      {filteredComponents.length === 0 ? (
        <div className="dsk-audit-empty">
          <SearchX size={30} />
          <p>
            Nothing matches “{search}”. Component names and categories are searched —
            try “button”, “form” or “nav”.
          </p>
          <button className="dsk-secondary-btn" onClick={() => setSearch('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="dsk-components-grid">
          {filteredComponents.map((comp) => {
            const isSelected = selectedSet.has(comp.name);
            const variants = getVariantCount(comp);

            return (
              <div
                key={comp.name}
                className={`dsk-component-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleComponent(comp.name, !isSelected)}
              >
                <div className="dsk-card-preview">
                  {/* SVG Illustration Placeholder / Component Preview Box */}
                  <div className="dsk-card-preview-inner">
                    <span className="dsk-preview-text">{comp.name[0]}</span>
                  </div>
                  {isSelected && <CheckCircle size={18} className="dsk-card-check" />}
                </div>
                <div className="dsk-card-info">
                  <span className="dsk-card-title">{comp.name}</span>
                  <span className="dsk-card-variants">
                    {variants} {variants === 1 ? 'variant' : 'variants'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
