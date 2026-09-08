import { SearchIcon, ShoppingCartIcon, StoreIcon, UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lab 1 turns this array into the desktop nav; Lab 4 reuses it in the mobile
// sheet. Change the data, both change — that is the point.
const NAV_LINKS = [
  { label: 'New in', href: '#' },
  { label: 'Electronics', href: '#' },
  { label: 'Home', href: '#' },
  { label: 'Apparel', href: '#' },
  { label: 'Sale', href: '#' },
];

// TODO(lab-1.1): This component takes no props. Give it an optional
// `cartCount?: number` that defaults to 0, then pass `cartCount={3}` from
// App.tsx. See the guide, Lab 1 step 1.
export function SiteHeader() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* TODO(lab-4.1): The nav below is hidden under 768px, which leaves
            phones with no navigation at all. Add a <Sheet> here containing a
            hamburger trigger and the same NAV_LINKS. Guide, Lab 4 step A.
            Everything you need is already in @/components/ui/sheet. */}

        <a href="#" className="flex shrink-0 items-center gap-2 font-semibold">
          <StoreIcon className="text-primary size-5" />
          <span>ShopCrew</span>
        </a>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {/* TODO(lab-1.2): Only the FIRST link is rendered, by hand. Replace
              this with `NAV_LINKS.map(...)` so all five appear. Each element
              produced by a .map() needs a `key`. Guide, Lab 1 step 2. */}
          <a
            href={NAV_LINKS[0].href}
            className="text-muted-foreground hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            {NAV_LINKS[0].label}
          </a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* TODO(lab-1.3): Add the search box — a `relative` wrapper, an
              absolutely positioned <SearchIcon />, and an <Input />.
              Guide, Lab 1 step 3. */}
          <SearchIcon className="text-muted-foreground hidden size-4 sm:block" />

          <Button variant="ghost" size="icon" aria-label="Your account">
            <UserIcon />
          </Button>

          {/* TODO(lab-1.4): Show a <Badge> with the cart count, but only when
              it is above zero. Mind the `count && ...` trap — guide, Lab 1
              "Watch out". */}
          <Button variant="ghost" size="icon" aria-label="Cart" className="relative">
            <ShoppingCartIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
