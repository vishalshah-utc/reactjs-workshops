import { Link } from 'react-router';
import { SearchXIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * The splat route's element — anything no other route matched.
 *
 * Two things a 404 owes the user: an unambiguous statement that the address is
 * wrong (not that the site is broken), and a way out that is not the back
 * button.
 *
 * Note `<Link>` rather than `<a href>`. An anchor triggers a full document
 * request: the browser throws away the whole React tree, re-downloads the
 * bundle, and re-mounts the app — cart state, scroll position and all. `Link`
 * changes the URL in place and lets the router swap the matched route. On a
 * client-rendered app the difference is roughly a second of blank screen.
 */
export function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <SearchXIcon className="text-muted-foreground size-10" />
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">We could not find that page</h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          The address may be mistyped, or the product may have been removed from
          the catalogue.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to="/">Back to the storefront</Link>
      </Button>
    </div>
  );
}
