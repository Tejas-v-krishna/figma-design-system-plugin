import React from 'react';
import { useStore, ExportFormat } from '../store';
import { Code, Copy, Check, Download } from 'lucide-react';
import { copyText } from '../clipboard';
import { downloadText, fileNameFor } from '../download';

export const CodeExportView: React.FC = () => {
  const exportFormat = useStore((s) => s.exportFormat);
  const setExportFormat = useStore((s) => s.setExportFormat);
  const requestExport = useStore((s) => s.requestExport);
  const exportResult = useStore((s) => s.exportResult);
  const exportBusy = useStore((s) => s.exportBusy);

  const [copied, setCopied] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);

  // The "Copied" checkmark resets on a timer, and that timer outlives the view
  // if the user switches tabs inside the two seconds. Holding it in a ref lets
  // the unmount cleanup cancel it, and lets a second copy restart the two
  // seconds instead of inheriting the first one's remaining time.
  const copyResetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (copyResetTimer.current !== null) clearTimeout(copyResetTimer.current);
    },
    []
  );

  const formats: { key: ExportFormat; label: string }[] = [
    { key: 'json', label: 'Design Tokens JSON' },
    { key: 'css', label: 'CSS Variables' },
    { key: 'tailwind', label: 'Tailwind Config' },
    { key: 'dtcg', label: 'W3C DTCG Format' },
  ];

  const handleExport = (fmt: ExportFormat) => {
    // The notice belongs to the output that was on screen, not to the view. It
    // used to survive a format switch, so "Copy was blocked" sat above a freshly
    // generated CSS export that nobody had tried to copy yet — a stale warning
    // about a different thing entirely. Same for the "Copied!" tick.
    setNotice(null);
    setCopied(false);
    if (copyResetTimer.current !== null) {
      clearTimeout(copyResetTimer.current);
      copyResetTimer.current = null;
    }
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
      setNotice(ok ? null : 'Copy was blocked. Select the code and press Ctrl+C.');
      if (copyResetTimer.current !== null) clearTimeout(copyResetTimer.current);
      if (ok) copyResetTimer.current = setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    if (!exportResult) return;
    const name = fileNameFor(exportFormat);
    setNotice(
      downloadText(exportResult, name)
        ? null
        : 'Saving the file was blocked. Copy the code instead.',
    );
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
              <div className="dsk-code-block-actions">
                <button className="dsk-copy-btn" onClick={handleDownload}>
                  <Download size={14} />
                  Save file
                </button>
                <button className="dsk-copy-btn" onClick={handleCopy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
            {notice && (
              <p className="dsk-copy-error" role="status">
                {notice}
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
