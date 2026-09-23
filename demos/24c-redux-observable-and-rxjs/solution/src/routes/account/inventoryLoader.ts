import type { LoaderFunctionArgs } from 'react-router';
import { listCategories } from '../../api/services/products';
import type { CategoryOption } from '../../types';

/**
 * The ONE thing on this screen that still comes from a route loader.
 *
 * That is not an inconsistency, it is the line: the category list is
 * unchanging server state that the toolbar cannot render without, so the route
 * should block on it and the store has nothing to add. The PRODUCTS are the
 * experiment — they go through the store precisely so you can see what owning
 * the async costs.
 *
 * It also fails safely. A category list that does not load leaves an empty
 * select, not a broken page, because losing a filter is not losing the screen.
 */
export async function inventoryLoader({ request }: LoaderFunctionArgs) {
  try {
    const categories = await listCategories({ signal: request.signal });
    return { categories: categories.map((c): CategoryOption => ({ id: c.slug, name: c.name })) };
  } catch {
    return { categories: [] as CategoryOption[] };
  }
}
