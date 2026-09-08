import { products } from '@/data/products';
import { CategoryStrip } from '@/components/CategoryStrip';
import { PageHeader } from '@/components/PageHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * Builds the category chips from the product list.
 *
 * Given to you complete — Lab 4 wires it up. Note it runs on every render,
 * and that is fine: 24 items, microseconds. Do NOT wrap it in `useMemo`.
 * Session 9 measures what memoisation costs before spending it.
 */
function buildCategories(items: typeof products) {
  const counts = new Map<string, { id: string; name: string; count: number }>();
  for (const product of items) {
    const existing = counts.get(product.categoryId);
    if (existing) existing.count += 1;
    else counts.set(product.categoryId, { id: product.categoryId, name: product.categoryName, count: 1 });
  }
  return [{ id: 'all', name: 'All', count: items.length }, ...counts.values()];
}

export default function App() {
  // TODO(lab-4.2): Add density state.
  //   const [density, setDensity] = useState<GridDensity>('comfortable');
  //   The type parameter matters — without it TypeScript infers `string` and
  //   setDensity('banana') would compile. Guide, Lab 4 step B.
  //
  // TODO(lab-4.4): Add category state and DERIVE the visible list.
  //   const [activeCategory, setActiveCategory] = useState('all');
  //   const categories = buildCategories(products);
  //   const visibleProducts = activeCategory === 'all'
  //     ? products
  //     : products.filter((p) => p.categoryId === activeCategory);
  //   There is deliberately NO useState for visibleProducts. Guide, Lab 4 step D.

  const categories = buildCategories(products);

  return (
    <div className="flex min-h-full flex-col">
      {/* TODO(lab-1.1): pass cartCount={3} once SiteHeader accepts it */}
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* TODO(lab-4.3): Pass the density toggle into PageHeader's `actions`
            slot — two Buttons in a bordered group. PageHeader itself will not
            need changing, which is Lab 2's slot paying off. */}
        <PageHeader title="All products" description={`${products.length} products`} />

        {/* The strip renders, but clicking a chip does nothing: `activeId` is
            hard-coded and `onSelect` throws the choice away. TODO(lab-4.4)
            replaces these two with real state. CategoryStrip itself is written
            for you — read it, it holds no state of its own, which is exactly
            why it needs both of these from above. */}
        <div className="mt-6">
          <CategoryStrip categories={categories} activeId="all" onSelect={() => {}} />
        </div>

        {/* TODO(lab-3.5): Render <ProductGrid products={products} />.
            In Lab 4 this becomes visibleProducts, with density passed too. */}
        <div className="mt-6">
          <p className="text-muted-foreground rounded-xl border border-dashed py-16 text-center text-sm">
            The product grid goes here — Lab 3.
          </p>
        </div>
      </main>

      {/* TODO(lab-4.5): No code change for this one — open React DevTools
          (a "Components" tab in your browser devtools), select App, and watch
          the two pieces of state above change as you click. Then turn on
          "Highlight updates when components render" in its settings and click
          a wishlist heart. Note what flashes. Guide, Lab 4 step E. */}
      <SiteFooter />
    </div>
  );
}
