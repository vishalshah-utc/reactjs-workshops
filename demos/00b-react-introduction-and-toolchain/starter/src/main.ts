import './style.css';
import { fetchCatalogue, isApiError } from './api';
import { categoriesOf, filterByCategory, searchProducts } from './lib/catalog';
import { debounce } from './lib/fn';
import { renderCategoryOptions, renderGrid, syncHearts } from './render';
import type { Product } from './types';

// ---- The state. Every pixel below is DERIVED from these values — by hand, in every handler.
let allProducts: Product[] = [];
let category = 'all';
let query = '';
const wishlist = new Set<number>();

// ---- DOM handles. `querySelector<T>` returns `T | null`; the `!` says "index.html has it".
const status = document.querySelector<HTMLElement>('#status')!;
const grid = document.querySelector<HTMLElement>('#grid')!;
const categorySelect = document.querySelector<HTMLSelectElement>('#category')!;
const searchInput = document.querySelector<HTMLInputElement>('#search')!;
const wishlistCount = document.querySelector<HTMLElement>('#wishlist-count')!;

function visibleProducts(): Product[] {
  return searchProducts(filterByCategory(allProducts, category), query);
}

categorySelect.addEventListener('change', () => {
  category = categorySelect.value;
  renderGrid(grid, visibleProducts());
  syncHearts(grid, wishlist); // forget this line and the hearts lie
});

searchInput.addEventListener(
  'input',
  debounce(() => {
    query = searchInput.value;
    renderGrid(grid, visibleProducts());
    syncHearts(grid, wishlist); // …and again here
  }, 200),
);

// Event DELEGATION: one listener on the grid, not one per heart. Cards come and go; the listener stays.
grid.addEventListener('click', (event) => {
  const heart = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action="wish"]');
  if (!heart) return;
  const id = Number(heart.dataset.id);
  if (wishlist.has(id)) wishlist.delete(id);
  else wishlist.add(id);
  syncHearts(grid, wishlist);
  wishlistCount.textContent = String(wishlist.size);
});

async function load(): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000); // give up after 8 s
  status.textContent = 'Loading 194 products…';

  try {
    const catalogue = await fetchCatalogue(controller.signal);
    allProducts = catalogue.products;
    status.textContent = `${catalogue.total} products · ${catalogue.categories.length} categories`;
  } catch (error: unknown) {
    // `unknown` is the honest type of a caught value. Narrow before you read anything off it.
    const reason = isApiError(error)
      ? `HTTP ${error.status}: ${error.message}`
      : error instanceof Error
        ? error.message
        : String(error);
    // Offline fallback via a DYNAMIC import: the bundled data is only downloaded if we get here.
    const { sampleProducts } = await import('./data/sampleProducts');
    allProducts = sampleProducts;
    status.textContent = `Could not reach DummyJSON (${reason}) — showing ${sampleProducts.length} bundled products`;
  } finally {
    clearTimeout(timeout);
  }

  renderCategoryOptions(categorySelect, categoriesOf(allProducts));
  renderGrid(grid, visibleProducts());
  syncHearts(grid, wishlist);
}

void load();
