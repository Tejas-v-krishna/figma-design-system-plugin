import React from 'react';
import { useStore, ExportFormat } from '../store';
import { Code, Copy, Check } from 'lucide-react';
import { copyText } from '../clipboard';

export const CodeExportView: React.FC = () => {
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const requestExport = useStore((s) => s.requestExport);
  const exportResult = useStore((s) => s.exportResult);
  const exportBusy = useStore((s) => s.exportBusy);

  const [copied, setCopied] = React.useState(false);
  const [copyError, setCopyError] = React.useState<string | null>(null);

  const formats: { key: ExportFormat; label: string }[] = [
    { key: 'json', label: 'Design Tokens JSON' },
    { key: 'css', label: 'CSS Variables' },
    { key: 'tailwind', label: 'Tailwind Config' },
    { key: 'dtcg', label: 'W3C DTCG Format' },
  ];

  const handleExport = (fmt: ExportFormat) => {
    setExportFormat(fmt);
    requestExport(fmt);
  };

  const handleCopy = () => {
    if (!exportResult) return;
    // The confirmation waits on the actual result. It used to be set
    // unconditionally alongside a floating writeText, so a copy the browser
    // refused still showed a checkmark and the user pasted stale content.
    void copyText(exportResult).then((ok) => {
      setCopied(ok);
      setCopyError(ok ? null : 'Copy was blocked. Select the code and press Ctrl+C.');
      if (ok) setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="dsk-code-view-container">
      <div className="dsk-code-hero">
        <div className="dsk-code-illustration">
          <Code size={48} className="dsk-code-icon" />
        </div>
        <div className="dsk-code-header-badge">
          <h2>Export Code</h2>
        </div>
        <p className="dsk-code-desc">
          Export your tokens and components for development use across web, mobile, and design tools.
        </p>

        <div className="dsk-code-format-pills">
          {formats.map((fmt) => (
            <button
              key={fmt.key}
              className={`dsk-format-pill ${exportFormat === fmt.key ? 'active' : ''}`}
              onClick={() => handleExport(fmt.key)}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {exportResult ? (
          <div className="dsk-code-block-wrapper">
            <div className="dsk-code-block-header">
              <span>{exportFormat.toUpperCase()} Export Output</span>
              <button className="dsk-copy-btn" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            {copyError && (
              <p className="dsk-copy-error" role="status">
                {copyError}
              </p>
            )}
            <pre className="dsk-code-block">{exportResult}</pre>
          </div>
        ) : (
          <button
            className="dsk-primary-btn hero-btn"
            onClick={() => handleExport(exportFormat)}
            disabled={exportBusy}
          >
            {exportBusy ? 'Generating Export…' : `Generate ${exportFormat.toUpperCase()} Code →`}
          </button>
        )}
      </div>
    </div>
  );
};
