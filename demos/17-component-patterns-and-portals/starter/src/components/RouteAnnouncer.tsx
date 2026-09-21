import { useEffect, useRef, type RefObject } from 'react';
import { useLocation } from 'react-router';

interface RouteAnnouncerProps {
  /** The region the pages render into. Focus lands on its <h1> if that opted in, else on the region itself. */
  mainRef: RefObject<HTMLElement | null>;
}

/**
 * A screen-reader user activates a link in a SPA and… nothing. No page load,
 * no new document title, focus still on the link they pressed. This does what
 * the browser does for a full page load: moves focus to the new page's heading
 * and announces it.
 *
 * Everything here is a READ plus `focus()` — never a mutation of a node React
 * rendered into. The one node we write to, the live region, is rendered EMPTY,
 * so its text is ours (📖 study-notes 11 §6).
 */
export function RouteAnnouncer({ mainRef }: RouteAnnouncerProps) {
  const { pathname } = useLocation();
  const liveRef = useRef<HTMLDivElement>(null);
  // "Which path did we last announce?" — never displayed, must survive renders: a ref. It also makes the
  // effect idempotent under StrictMode's double mount, which is why `lastFlash` in ProductsPage is a ref too.
  const lastAnnounced = useRef<string | null>(null);

  useEffect(() => {
    if (lastAnnounced.current === null) {
      lastAnnounced.current = pathname; // the first render IS a page load — the browser already announced it
      return;
    }
    if (lastAnnounced.current === pathname) return;
    lastAnnounced.current = pathname;

    const main = mainRef.current;
    if (!main) return;

    const heading = main.querySelector<HTMLElement>('h1');
    const title = heading?.textContent?.trim() || 'ShopScope';
    document.title = `${title} · ShopScope`; // not React-rendered — ours to set

    // Only an element with a tabindex can take focus. The heading opted in via tabIndex={-1} (PageHeader); otherwise the region.
    const target = heading?.hasAttribute('tabindex') ? heading : main;
    target.focus({ preventScroll: true }); // ScrollRestoration owns the scroll position

    // Clear, then set: the same text twice is not a change, and live regions announce CHANGES.
    if (liveRef.current) {
      liveRef.current.textContent = '';
      liveRef.current.textContent = `Navigated to ${title}`;
    }
  }, [pathname, mainRef]); // pathname ONLY — a search-param change (every keystroke in the search box) is not a new page

  return <div ref={liveRef} aria-live="polite" aria-atomic="true" className="visually-hidden" />;
}
