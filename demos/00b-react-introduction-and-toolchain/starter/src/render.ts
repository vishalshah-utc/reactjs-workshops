/**
 * Imperative rendering: create elements, set properties, append. Every
 * function in here is a hand-written version of something React does for you
 * from Session 2 onwards — read it once, then never write it again.
 */
import type { Category } from './lib/catalog';
import { brandLabel, stockLabel } from './lib/catalog';
import { discountedPrice, formatPrice } from './lib/format';
import type { Product } from './types';

function createCard(product: Product): HTMLElement {
  const card = document.createElement('article');
  card.className = 'card';
  card.dataset.id = String(product.id); // dataset values are ALWAYS strings

  const img = document.createElement('img');
  img.src = product.thumbnail;
  img.alt = '';
  img.loading = 'lazy';

  const title = document.createElement('h2');
  title.textContent = product.title; // textContent, never innerHTML, for text you did not write

  const meta = document.createElement('p');
  meta.className = 'meta';
  meta.textContent = `${brandLabel(product)} · ${stockLabel(product)}`;

  const price = document.createElement('p');
  price.className = 'price';
  const sale = document.createElement('strong');
  sale.textContent = formatPrice(discountedPrice(product.price, product.discountPercentage));
  const was = document.createElement('s');
  was.textContent = formatPrice(product.price);
  price.append(sale, ' ', was);

  const heart = document.createElement('button');
  heart.type = 'button';
  heart.className = 'heart';
  heart.dataset.action = 'wish'; // the delegated listener in main.ts looks for this
  heart.dataset.id = String(product.id);
  heart.setAttribute('aria-pressed', 'false');
  heart.setAttribute('aria-label', `Save ${product.title}`);
  heart.textContent = '♡';

  card.append(img, title, meta, price, heart);
  return card;
}

/** Throw every old card away and build new ones. Simple — and the reason the hearts reset (see main.ts). */
export function renderGrid(root: HTMLElement, products: readonly Product[]): void {
  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No products match.';
    root.replaceChildren(empty);
    return;
  }
  root.replaceChildren(...products.map(createCard));
}

/** Walk every heart and make the DOM agree with the Set. Must run after EVERY renderGrid — by hand. */
export function syncHearts(root: HTMLElement, wishlist: ReadonlySet<number>): void {
  for (const heart of root.querySelectorAll<HTMLButtonElement>('button[data-action="wish"]')) {
    const saved = wishlist.has(Number(heart.dataset.id));
    heart.setAttribute('aria-pressed', String(saved));
    heart.textContent = saved ? '♥' : '♡';
  }
}

export function renderCategoryOptions(select: HTMLSelectElement, categories: readonly Category[]): void {
  const options = ['all', ...categories].map((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category === 'all' ? 'All categories' : category;
    return option;
  });
  select.replaceChildren(...options);
}
