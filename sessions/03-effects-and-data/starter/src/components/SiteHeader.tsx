import { MenuIcon, SearchIcon, ShoppingCartIcon, StoreIcon, UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet';

const NAV_LINKS = [
  { label: 'New in', href: '#' },
  { label: 'Electronics', href: '#' },
  { label: 'Home', href: '#' },
  { label: 'Apparel', href: '#' },
  { label: 'Sale', href: '#' },
];

interface SiteHeaderProps {
  cartCount?: number;
  /** Opens the cart sheet. The header does not own the cart, only reports the click. */
  onCartClick?: () => void;
  /** Rendered between the logo and the nav — the storefront/back-office toggle. */
  children?: React.ReactNode;
}

export function SiteHeader({ cartCount = 0, onCartClick, children }: SiteHeaderProps) {
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
                  <a href={link.href} className="hover:bg-accent rounded-md px-3 py-2 text-sm font-medium">
                    {link.label}
                  </a>
                </SheetClose>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <a href="#" className="flex shrink-0 items-center gap-2 font-semibold">
          <StoreIcon className="text-primary size-5" />
          <span>ShopCrew</span>
        </a>

        {children}

        {/* `hidden md:flex` — nav collapses into the Sheet on small screens. */}
        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
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
