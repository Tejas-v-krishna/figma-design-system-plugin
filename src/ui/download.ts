import { ExportFormat } from './store';

/** File extension each export format should be saved under. */
const EXTENSIONS: Record<ExportFormat, string> = {
  json: 'json',
  dtcg: 'json',
  css: 'css',
  tailwind: 'js',
};

export function fileNameFor(format: ExportFormat): string {
  return `design-tokens.${EXTENSIONS[format]}`;
}

/**
 * Save text as a file download from inside the plugin iframe.
 *
 * A plugin UI has no filesystem access, so the only route out is the standard
 * anchor-with-object-URL trick. It works here because the iframe is same-origin
 * with a real document; `showSaveFilePicker` is not available.
 *
 * The object URL is revoked on the next tick rather than immediately: revoking
 * in the same statement as `click()` races Chrome's fetch of the blob and
 * intermittently produces a zero-byte file.
 *
 * Returns false when the download could not be started, so the caller can tell
 * the user to copy instead of leaving them waiting for a file that never lands.
 */
export function downloadText(text: string, fileName: string): boolean {
  if (!text) return false;

  let url: string | null = null;
  try {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  } finally {
    if (url) {
      const revoke = url;
      setTimeout(() => URL.revokeObjectURL(revoke), 1000);
    }
  }
}
