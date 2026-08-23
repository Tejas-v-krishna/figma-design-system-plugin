import { useEffect, useRef } from 'react';

// Calls `onEscape` when Escape is pressed while `active`. Used so overlays
// (modals, drawers, success screen) can be dismissed from the keyboard.
export function useEscape(active: boolean, onEscape: () => void): void {
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onEscape]);
}

// Returns a ref that, when attached to an element, receives focus as soon as
// `active` becomes true. Restores focus to the previously focused element on
// close so keyboard users aren't stranded.
export function useFocusOnOpen<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    // instanceof rather than a cast: document.activeElement is typed as Element,
    // which has no focus() at all, and the cast that used to be here was what
    // forced the defensive `?.focus?.()` on the restore below.
    prevFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = ref.current;
    // Defer to the next frame so the node is mounted/visible.
    const id = requestAnimationFrame(() => node?.focus());
    return () => {
      cancelAnimationFrame(id);
      prevFocus.current?.focus();
    };
  }, [active]);

  return ref;
}
