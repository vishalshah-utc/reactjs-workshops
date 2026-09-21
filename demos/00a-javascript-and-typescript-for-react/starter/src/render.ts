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

// TODO(lab-7.1): an empty state in renderGrid; syncHearts (aria-pressed from the Set); renderCategoryOptions
export function renderGrid(root: HTMLElement, products: readonly Product[]): void {
  root.replaceChildren(...products.map(createCard));
}

export function syncHearts(_root: HTMLElement, _wishlist: ReadonlySet<number>): void {}

export function renderCategoryOptions(_select: HTMLSelectElement, _categories: readonly Category[]): void {}
