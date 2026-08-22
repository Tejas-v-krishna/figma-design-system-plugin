import React from 'react';
import { useStore, ExportFormat } from '../store';
import { Code, Copy, Check } from 'lucide-react';

export const CodeExportView: React.FC = () => {
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const requestExport = useStore((s) => s.requestExport);
  const exportResult = useStore((s) => s.exportResult);
  const exportBusy = useStore((s) => s.exportBusy);

  const [copied, setCopied] = React.useState(false);

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
    if (exportResult) {
      navigator.clipboard.writeText(exportResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="figr-code-view-container">
      <div className="figr-code-hero">
        <div className="figr-code-illustration">
          <Code size={48} className="figr-code-icon" />
        </div>
        <div className="figr-code-header-badge">
          <h2>Export Code</h2>
        </div>
        <p className="figr-code-desc">
          Export your tokens and components for development use across web, mobile, and design tools.
        </p>

        <div className="figr-code-format-pills">
          {formats.map((fmt) => (
            <button
              key={fmt.key}
              className={`figr-format-pill ${exportFormat === fmt.key ? 'active' : ''}`}
              onClick={() => handleExport(fmt.key)}
            >
              {fmt.label}
            </button>
          ))}
        </div>

        {exportResult ? (
          <div className="figr-code-block-wrapper">
            <div className="figr-code-block-header">
              <span>{exportFormat.toUpperCase()} Export Output</span>
              <button className="dsk-copy-btn" onClick={handleCopy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre className="figr-code-block">{exportResult}</pre>
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
