/**
 * Copy text to the clipboard from inside a Figma plugin iframe.
 *
 * `navigator.clipboard.writeText` is the right API but it is not dependable
 * here: it requires a secure context and transient user activation, and in a
 * sandboxed plugin iframe without `allow="clipboard-write"` it rejects with a
 * NotAllowedError. So there is a fallback to the deprecated
 * `document.execCommand('copy')`, which works from a synchronous click handler
 * because it copies the current selection rather than asking for a permission.
 *
 * Returns whether the text actually landed on the clipboard. Callers must use
 * the result: showing a "Copied" checkmark for a copy that silently failed is
 * worse than showing nothing, because the user pastes stale content and blames
 * the wrong thing.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the selection-based path */
    }
  }

  return copyViaSelection(text);
}

function copyViaSelection(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  // Off-screen rather than display:none or hidden — an unrendered element has
  // nothing to select, so execCommand would copy an empty string.
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-9999px';
  area.style.opacity = '0';
  document.body.appendChild(area);

  try {
    area.select();
    area.setSelectionRange(0, text.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}
