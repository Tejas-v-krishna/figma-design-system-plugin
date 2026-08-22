import { useStore, View } from '../store';
import { Palette, Type, Boxes, ListChecks, Download, Search, Settings, Sparkles, Wand2 } from 'lucide-react';

const NAV: { key: View; label: string; icon: typeof Palette }[] = [
  { key: 'brand', label: 'Brand', icon: Palette },
  { key: 'typography', label: 'Typography', icon: Type },
  { key: 'components', label: 'Components', icon: Boxes },
  { key: 'review', label: 'Review', icon: ListChecks },
  { key: 'export', label: 'Export', icon: Download },
  { key: 'scan', label: 'Scan', icon: Search },
];

export function Sidebar() {
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const setOptionsOpen = useStore((s) => s.setOptionsOpen);
  const selected = useStore((s) => s.config.componentsToGenerate.length);

  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark-lg"><Sparkles size={22} /></div>
        <div>
          <div className="brand-name">FIGR</div>
          <div className="brand-sub">Design System</div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-label">Configure</div>
        {NAV.map((n) => {
          const Icon = n.icon;
          return (
            <button
              key={n.key}
              className={view === n.key ? 'nav-item active' : 'nav-item'}
              onClick={() => setView(n.key)}
            >
              <Icon size={17} /> {n.label}
            </button>
          );
        })}
        <button className="nav-item" onClick={() => setOptionsOpen(true)}>
          <Settings size={17} /> Options
        </button>
      </nav>

      <div className="nav-spacer" />
      <button className="sidebar-generate" onClick={() => setView('review')}>
        <Wand2 size={17} /> Generate system
      </button>
      <div className="sidebar-foot">{selected} component{selected === 1 ? '' : 's'} selected</div>
    </aside>
  );
}
