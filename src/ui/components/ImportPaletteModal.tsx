import { useState } from 'react';
import { useStore } from '../store';
import { parsePalette } from '../../shared/palette';
import { Button } from './controls';
import { useEscape, useFocusOnOpen } from '../hooks';
import { X } from 'lucide-react';

export function ImportPaletteModal() {
  const open = useStore((s) => s.importOpen);
  const setOpen = useStore((s) => s.setImportOpen);
  const importPalette = useStore((s) => s.importPalette);

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useFocusOnOpen<HTMLTextAreaElement>(open);
  const close = () => {
    setOpen(false);
    setText('');
    setError(null);
  };
  useEscape(open, close);

  if (!open) return null;

  const submit = () => {
    const res = parsePalette(text);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.config) {
      importPalette(res.config);
      setText('');
      setError(null);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Import palette</h3>
          <button className="link-btn" onClick={close} aria-label="Close"><X size={18} /></button>
        </div>
        <p className="step-hint" style={{ margin: 0 }}>
          Paste hex values or JSON. Recognized keys: primary, information, success, warning, error, neutral.
        </p>
        <textarea
          ref={textareaRef}
          className="code-input"
          placeholder={'#2563EB\nneutral #64748B\n\nor\n\n{\n  "primary": "#2563EB",\n  "neutral": "#64748B"\n}'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          style={{ marginTop: 12 }}
        />
        {error && <div className="modal-error">{error}</div>}
        <div className="modal-actions">
          <Button variant="ghost" onClick={close}>Cancel</Button>
          <Button onClick={submit}>Apply palette</Button>
        </div>
        <p className="modal-hint">Example: <code>primary #2563EB, success #10B981</code></p>
      </div>
    </div>
  );
}
