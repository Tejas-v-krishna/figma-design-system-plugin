import { useState } from 'react';
import { useStore, ExportFormat } from '../store';
import { Button } from './controls';
import { Copy, Download, Check, FileJson, FileCode, Paintbrush, Braces, FileCode2 } from 'lucide-react';

const FORMATS: { value: ExportFormat; label: string; icon: JSX.Element }[] = [
  { value: 'json', label: 'JSON', icon: <FileJson size={14} /> },
  { value: 'css', label: 'CSS', icon: <FileCode size={14} /> },
  { value: 'tailwind', label: 'Tailwind', icon: <Paintbrush size={14} /> },
  { value: 'dtcg', label: 'DTCG', icon: <Braces size={14} /> },
];

export function ExportPanel() {
  const format = useStore((s) => s.exportFormat);
  const setFormat = useStore((s) => s.setExportFormat);
  const result = useStore((s) => s.exportResult);
  const error = useStore((s) => s.exportError);
  const busy = useStore((s) => s.exportBusy);
  const requestExport = useStore((s) => s.requestExport);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!result) return;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    };
    try {
      navigator.clipboard?.writeText(result).then(done).catch(done);
    } catch {
      done();
    }
  };
  const download = () => {
    if (!result) return;
    const ext = format === 'tailwind' ? 'js' : format === 'dtcg' ? 'json' : format;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokens.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasOutput = !!result || !!error;

  return (
    <div>
      <div className="content-header">
        <h2>Export tokens</h2>
        <p className="subtitle">Pull your generated design tokens out as code.</p>
      </div>
      <div className="panel">
        <div className="format-tabs">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              className={format === f.value ? 'format-tab active' : 'format-tab'}
              onClick={() => setFormat(f.value)}
            >
              {f.icon} {f.label}
            </button>
          ))}
        </div>

        <Button onClick={() => requestExport(format)} disabled={busy}>
          {busy ? 'Generating…' : `Export as ${format.toUpperCase()}`}
        </Button>

        {!hasOutput && (
          <div className="empty-state">
            <FileCode2 size={26} />
            <p>
              Pick a format and export. Your tokens will appear here as copy-ready
              code — no design system generated yet? Run <strong>Generate system</strong> first.
            </p>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {result && (
          <>
            <div className="export-actions">
              <Button variant="secondary" onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button variant="secondary" onClick={download}><Download size={14} /> Download</Button>
            </div>
            <textarea className="code-box" readOnly value={result} />
          </>
        )}
      </div>
    </div>
  );
}
