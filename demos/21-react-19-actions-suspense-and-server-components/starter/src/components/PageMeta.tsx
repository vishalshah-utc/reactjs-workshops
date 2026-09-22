interface PageMetaProps {
  /** The page's own title. The app name is appended here, once, for every route. */
  title?: string;
  description?: string;
  /** Keep a page out of the index — the login screen, an account page. */
  noIndex?: boolean;
}

/**
 * Per-route document metadata, with no library and no portal: React 19 hoists
 * `<title>`, `<meta>` and `<link rel="…">` into `<head>` from wherever they
 * are rendered, and removes them again on unmount.
 */
// TODO(lab-3.1): return a fragment holding <title>, <meta name="description">, an
// og:title and — when `noIndex` — <meta name="robots" content="noindex">. Format the
// title in ONE helper (`${title} · ${env.appName}`) so no route can invent its own,
// and give every <meta> a `key`.
export function PageMeta(_props: PageMetaProps) {
  return null;
}
