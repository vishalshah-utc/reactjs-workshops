import { useEffect } from 'react';
import { useLatest } from './useLatest';

interface ShortcutOptions {
  /** Don't fire while the user is typing somewhere. Default true — a "/" in the search box is a slash, not a command. */
  ignoreWhenTyping?: boolean;
}

/** Inputs, textareas, selects and anything contentEditable: a keystroke there is text, not a command. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

/**
 * A single-key shortcut on the window, for the lifetime of the component.
 *
 * The handler is read through `useLatest`, so the listener is added ONCE and
 * still calls the newest handler — no unsubscribe/resubscribe on every render,
 * and no stale closure over last render's props.
 */
export function useKeyboardShortcut(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { ignoreWhenTyping = true }: ShortcutOptions = {},
): void {
  const handlerRef = useLatest(handler);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== key || event.ctrlKey || event.metaKey || event.altKey) return; // Cmd+/ etc. belong to the browser
      if (ignoreWhenTyping && isTypingTarget(event.target)) return;
      event.preventDefault(); // Firefox opens quick-find on "/" — we own the key now
      handlerRef.current(event);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [key, ignoreWhenTyping, handlerRef]);
}
