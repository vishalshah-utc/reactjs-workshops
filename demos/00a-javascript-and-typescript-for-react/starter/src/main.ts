import './style.css';
import { sampleProducts } from './data/sampleProducts';
import { formatPrice } from './lib/format';

// Each lab replaces everything BELOW the markers. Delete a marker when its lab is done.
// TODO(lab-1.3): one template-literal line per sample product (title, price, in stock / sold out) into #grid as a <pre>
// TODO(lab-4.3): fetch 194 products (a preview of Lab 6) and chain filter → sort → slice → map; console.table it
// TODO(lab-6.4): load through fetchCatalogue with an AbortController, `unknown` in catch, a dynamic-import fallback
// TODO(lab-7.2): hold the state, render the grid, delegate clicks, keep the hearts in sync by hand

const grid = document.querySelector<HTMLElement>('#grid')!;
grid.textContent = `${sampleProducts.length} sample products loaded · formatPrice(9.99) currently gives "${formatPrice(9.99)}" — start in src/lib/format.ts`;
