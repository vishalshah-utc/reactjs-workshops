import { Link } from 'react-router';
import { MenuIcon, SearchIcon, ShoppingCartIcon, StoreIcon, UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet';

/**
 * TODO(lab-1.3): these are dead `href="#"` anchors. Make them real.
 *
 * Two separate changes, and the second is the one people skip:
 *
 *  1. `<a href>` → `<Link to>`. An anchor triggers a FULL DOCUMENT REQUEST:
 *     the browser discards the React tree, re-downloads the bundle and
 *     re-mounts everything. Your cart state, scroll position and open dialogs
 *     all go. `Link` changes the URL in place and lets the router swap the
 *     matched route — no reload, no flash, state intact.
 *
 *     Click a nav link with the network tab open, before and after. The
 *     difference between a document request and nothing at all is the whole
 *     argument for client-side routing.
 *
 *  2. For the links that indicate WHERE YOU ARE, use `<NavLink>` instead
 *     (add it to the import at the top of this file).
 *     It passes an `isActive` boolean to a className function:
 *
 *       <NavLink
 *         to={link.to}
 *         className={({ isActive }) =>
 *           cn('rounded-md px-3 py-2 text-sm font-medium transition-colors',
 *              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground')
 *         }
 *       >
 *
 *     Also give the active one `aria-current="page"` — NavLink sets that for
 *     you, which is why it is worth using rather than reading the location and
 *     comparing strings yourself.
 *
 * Note `end` on the "/" link: without it, NavLink treats `/` as active for
 * EVERY route, because every path starts with it.
 *
 * Guide, Lab 1 step D.
 */
const NAV_LINKS = [
  { label: 'Storefront', to: '/', end: true },
  { label: 'Cart', to: '/cart' },
  { label: 'Back-office', to: '/backoffice' },
];

interface SiteHeaderProps {
  cartCount?: number;
  /** Opens the cart sheet. The header does not own the cart, only reports the click. */
  onCartClick?: () => void;
}

export function SiteHeader({ cartCount = 0, onCartClick }: SiteHeaderProps) {
  return (
    // `sticky top-0 z-40` keeps the header pinned while the grid scrolls.
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile nav. The Sheet is only mounted below `md`, so the same links
            do not appear twice in the accessibility tree. */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <StoreIcon className="text-primary size-5" />
                ShopCrew
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <SheetClose asChild key={link.label}>
                  {/* TODO(lab-1.3): <a href> → <Link to={link.to}> */}
                  <a href="#" className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
                    {link.label}
                  </a>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold">
          <StoreIcon className="text-primary size-5" />
          <span>ShopCrew</span>
        </Link>

        {/* `hidden md:flex` — nav collapses into the Sheet on small screens. */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {/* TODO(lab-1.3): <a href="#"> → <NavLink to={link.to} end={link.end}>
              with an isActive className function. See the note above. */}
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href="#"
              className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            {/* `pointer-events-none` so a click on the icon still focuses the
                input underneath it. */}
            <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Search products"
              aria-label="Search products"
              className="w-44 pl-8 lg:w-64"
            />
          </div>

          <Button variant="ghost" size="icon" aria-label="Your account">
            <UserIcon />
          </Button>

          <Button
            variant="ghost" size="icon"
            aria-label={`Cart, ${cartCount} items`}
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCartIcon />
            {cartCount > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 size-4 justify-center p-0 text-[10px] tabular-nums">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
