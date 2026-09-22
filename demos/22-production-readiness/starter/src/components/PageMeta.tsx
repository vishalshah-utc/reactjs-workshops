import { env } from '../config/env';

interface PageMetaProps {
  /** The page's own title. The app name is appended here, once, for every route. */
  title?: string;
  description?: string;
  /** Keep a page out of the index — the login screen, an account page. */
  noIndex?: boolean;
}

/** One place decides what a tab says, so no route can invent its own format. */
function formatTitle(title?: string) {
  return title ? `${title} · ${env.appName}` : `${env.appName} — the product explorer`;
}

/**
 * Per-route document metadata, with no library and no portal.
 *
 * React 19 HOISTS `<title>`, `<meta>` and `<link rel="…">` out of wherever you
 * render them and into `<head>`. That is the entire feature: this component
 * returns head tags from the middle of a page tree, React moves them, and it
 * removes them again when the component unmounts. React Helmet existed for
 * exactly this and is now three hundred lines you do not need.
 *
 * Two rules it is easy to break:
 *   - Render ONE `<title>` at a time. Two mounted at once and the browser uses
 *     the first one in the document, which is whichever React inserted first —
 *     not whichever is "more specific".
 *   - `key` matters on `<meta>`. Without one, two routes that each render a
 *     description can leave both in the head across a navigation.
 *
 * And the limit, which Demo 22 measures with `curl`: this runs in the BROWSER.
 * The HTML the server sends still has whatever `index.html` says and an empty
 * `<div id="root">`. Crawlers that execute JavaScript will see these tags;
 * anything that reads the raw response — a link preview bot, a scraper, most
 * social cards — will not. Per-route metadata in a CSR app is for humans
 * reading tabs and bookmarks. 📖 study-notes 19 §11
 */
export function PageMeta({ title, description, noIndex = false }: PageMetaProps) {
  return (
    <>
      <title>{formatTitle(title)}</title>
      {description && <meta key="description" name="description" content={description} />}
      {/* Open Graph: the same string, under the name link previews read. */}
      <meta key="og:title" property="og:title" content={formatTitle(title)} />
      {noIndex && <meta key="robots" name="robots" content="noindex" />}
    </>
  );
}
