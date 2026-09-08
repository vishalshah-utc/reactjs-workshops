import { StoreIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const COLUMNS = [
  { title: 'Shop', links: ['New arrivals', 'Best sellers', 'Sale', 'Gift cards'] },
  { title: 'Help', links: ['Track an order', 'Returns', 'Shipping', 'Contact us'] },
  { title: 'Company', links: ['About', 'Careers', 'Press', 'Sustainability'] },
];

export function SiteFooter() {
  return (
    <footer className="bg-muted/40 mt-16 border-t">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <StoreIcon className="text-primary size-5" />
              ShopCrew
            </div>
            <p className="text-muted-foreground text-sm">
              The storefront you build across ten sessions of the ReactJS workshop series.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h2 className="mb-3 text-sm font-semibold">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        <p className="text-muted-foreground text-xs">
          ShopCrew is a teaching project. No products are real and nothing here is for sale.
        </p>
      </div>
    </footer>
  );
}
