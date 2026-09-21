import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * While `active`, keep keyboard focus inside `containerRef`: focus moves in on activation, Tab and Shift+Tab wrap
 * at the ends, and on deactivation focus goes BACK to whatever had it before — the button that opened the dialog.
 * Native <dialog>.showModal() does all of this for free; a createPortal dialog has to do it by hand. This is the
 * hand. It is also the part every headless library gets right and most hand-rolled modals get wrong.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // Who had focus? Captured NOW, before we move it, so the cleanup can hand it back.
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables()[0] ?? container).focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault(); // nothing to move to — stay on the container
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      // Wrap: Shift+Tab on the first item → the last; Tab on the last → the first. Every other Tab is the browser's.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      opener?.focus(); // RESTORE: the single most-forgotten step. Without it focus falls to <body> and a screen-reader user is lost.
    };
  }, [containerRef, active]);
}
