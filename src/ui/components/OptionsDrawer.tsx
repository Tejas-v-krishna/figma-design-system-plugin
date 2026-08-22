import { useStore } from '../store';
import { Toggle, Button } from './controls';
import { useEscape, useFocusOnOpen } from '../hooks';
import { X } from 'lucide-react';

export function OptionsDrawer() {
  const open = useStore((s) => s.optionsOpen);
  const setOpen = useStore((s) => s.setOptionsOpen);
  const config = useStore((s) => s.config);
  const updateOptions = useStore((s) => s.updateOptions);

  const closeRef = useFocusOnOpen<HTMLButtonElement>(open);
  useEscape(open, () => setOpen(false));

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={() => setOpen(false)} />
      <div className="drawer">
        <div className="drawer-head">
          <h3>Generation options</h3>
          <button ref={closeRef} className="link-btn" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
        </div>

        <Toggle label="Generate Figma styles (color / text / effect)" checked={config.options.createStyles} onChange={(v) => updateOptions({ createStyles: v })} />
        <Toggle label="Publish color tokens as Figma Variables" checked={config.options.createVariables} onChange={(v) => updateOptions({ createVariables: v })} />
        <Toggle label="Include dark-mode token variants" checked={config.options.includeDarkMode} onChange={(v) => updateOptions({ includeDarkMode: v })} />
        <Toggle label="Generate variant siblings" checked={config.options.includeVariants} onChange={(v) => updateOptions({ includeVariants: v })} />
        <Toggle label="Generate state siblings" checked={config.options.includeStates} onChange={(v) => updateOptions({ includeStates: v })} />
        <Toggle label="Emit full Figma variant sets (Variant / State / Size)" checked={config.options.generateFullVariantSets} onChange={(v) => updateOptions({ generateFullVariantSets: v })} />
        <Toggle label="Organize generated output into pages" checked={config.options.organizePages} onChange={(v) => updateOptions({ organizePages: v })} />

        <Button onClick={() => setOpen(false)} style={{ width: '100%', marginTop: 14 }}>
          Done
        </Button>
      </div>
    </>
  );
}
