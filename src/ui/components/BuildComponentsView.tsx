import React, { useState } from 'react';
import { useStore } from '../store';
import { COMPONENT_DEFINITIONS } from '../../shared/component-definitions';
import { countComponentsFor } from '../../shared/variant-count';
import { Search, SearchX, CheckSquare, XSquare, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'buttons', label: 'Buttons' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'forms', label: 'Forms' },
  { id: 'cards', label: 'Cards' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'data-display', label: 'Data' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'media', label: 'Media' },
];

function MiniPreview({ name, category }: { name: string; category: string }) {
  switch (category) {
    case 'buttons':
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
          <div style={{ background: 'var(--brand, #2563EB)', borderRadius: 6, padding: '4px 14px', color: '#fff', fontSize: 10, fontWeight: 600 }}>
            {name === 'IconButton' ? '❖' : 'Button'}
          </div>
        </div>
      );
    case 'inputs':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '70%', alignItems: 'flex-start' }}>
          <div style={{ width: '40%', height: 4, background: '#CBD5E1', borderRadius: 2 }} />
          <div style={{ width: '100%', height: 16, border: '1.5px solid #94A3B8', borderRadius: 4, background: '#FFF', display: 'flex', alignItems: 'center', padding: '0 4px' }}>
            <div style={{ width: 2, height: 8, background: 'var(--brand, #2563EB)' }} />
          </div>
        </div>
      );
    case 'cards':
      return (
        <div style={{ width: '65%', height: '70%', border: '1px solid #CBD5E1', borderRadius: 6, background: '#FFF', padding: 4, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '50%', height: 4, background: '#64748B', borderRadius: 2 }} />
          <div style={{ width: '85%', height: 3, background: '#CBD5E1', borderRadius: 1.5 }} />
          <div style={{ width: '65%', height: 3, background: '#CBD5E1', borderRadius: 1.5 }} />
        </div>
      );
    case 'feedback':
      return (
        <div style={{ width: '75%', height: 18, borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand, #2563EB)' }} />
          <div style={{ width: '60%', height: 3, background: 'var(--brand, #2563EB)', borderRadius: 1.5 }} />
        </div>
      );
    case 'navigation':
      return (
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <div style={{ padding: '2px 6px', background: '#E2E8F0', borderRadius: 4, fontSize: 9, fontWeight: 600, color: '#334155' }}>Tab 1</div>
          <div style={{ padding: '2px 6px', background: 'transparent', borderRadius: 4, fontSize: 9, color: '#64748B' }}>Tab 2</div>
        </div>
      );
    case 'media':
      return (
        <div style={{ width: '60%', height: '65%', border: '1px solid #CBD5E1', borderRadius: 6, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: 16 }}>
          🖼
        </div>
      );
    default:
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '60%', alignItems: 'center' }}>
          <div style={{ width: '80%', height: 4, background: 'var(--brand, #2563EB)', borderRadius: 2 }} />
          <div style={{ width: '100%', height: 3, background: '#CBD5E1', borderRadius: 1.5 }} />
        </div>
      );
  }
}

export const BuildComponentsView: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const search = useStore((s) => s.componentSearch);
  const setSearch = useStore((s) => s.setComponentSearch);
  const config = useStore((s) => s.config);
  const toggleComponent = useStore((s) => s.toggleComponent);
  const selectAll = useStore((s) => s.selectAll);

  const selectedSet = new Set(config.componentsToGenerate);
  const allSelected = selectedSet.size === COMPONENT_DEFINITIONS.length;

  const filteredComponents = COMPONENT_DEFINITIONS.filter((comp) => {
    const matchCategory = activeCategory === 'all' || comp.category === activeCategory;
    const matchSearch =
      comp.name.toLowerCase().includes(search.toLowerCase()) ||
      comp.category.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getVariantCount = (comp: typeof COMPONENT_DEFINITIONS[0]) =>
    countComponentsFor(comp, config.options);

  const totalVariants = COMPONENT_DEFINITIONS.filter((c) => selectedSet.has(c.name)).reduce(
    (sum, c) => sum + getVariantCount(c),
    0
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

      {/* Category filter chips */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, margin: '8px 0' }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: activeCategory === cat.id ? 600 : 400,
              borderRadius: 14,
              border: '1px solid',
              borderColor: activeCategory === cat.id ? 'var(--brand, #2563EB)' : 'var(--line-panel, #E2E8F0)',
              background: activeCategory === cat.id ? 'var(--brand-wash, #EFF6FF)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--brand, #2563EB)' : '#64748B',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="dsk-components-count">
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
          <button className="dsk-secondary-btn" onClick={() => { setSearch(''); setActiveCategory('all'); }}>
            Clear filters
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
                  <div className="dsk-card-preview-inner">
                    <MiniPreview name={comp.name} category={comp.category} />
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
