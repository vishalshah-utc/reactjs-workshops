import type { Product } from '@/types';

/**
 * The one place that knows how to talk to the API.
 *
 * Everything goes through here rather than calling `fetch` in components,
 * for three reasons that all pay off later:
 *
 *   - one place to add the auth header (Session 6)
 *   - one place to turn a non-2xx response into a real Error (below)
 *   - one place to change when the URL or the shape changes
 *
 * A component that calls `fetch` directly is a component you cannot test
 * without a network, and cannot reuse anywhere else.
 */

const BASE = '/api';

/**
 * The shape every error in the app is normalised to.
 *
 * Written with explicit fields rather than TypeScript's `constructor(public
 * status: number)` shorthand, because `erasableSyntaxOnly` is on in
 * tsconfig — that flag restricts us to TypeScript that can be removed by
 * simply deleting the types, with no code generation. It is what lets Node
 * and modern bundlers strip types without a compiler.
 */
export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * `fetch` does NOT reject on 404 or 500.
 *
 * This surprises everyone once. A promise from `fetch` only rejects when the
 * request could not be made at all — offline, DNS failure, CORS. A 500 is a
 * perfectly successful HTTP round trip, so `fetch` resolves happily with
 * `ok: false`, and a `.then()` that forgets to check it will cheerfully try to
 * render an error page as if it were data.
 */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  if (!response.ok) {
    let code = 'UNKNOWN';
    let message = `Request failed with ${response.status}`;
    let fieldErrors: Record<string, string> | undefined;
    try {
      const body = await response.json();
      code = body?.error?.code ?? code;
      message = body?.error?.message ?? message;
      fieldErrors = body?.error?.fieldErrors;
    } catch {
      // A non-JSON error body (a proxy timeout, an HTML error page). Keep the
      // status-derived message rather than throwing a parse error over the top
      // of the real problem.
    }
    throw new ApiError(response.status, code, message, fieldErrors);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface ProductQuery {
  q?: string;
  category?: string;
  sort?: string;
  inStock?: boolean;
  onSale?: boolean;
  limit?: number;
  /** Milliseconds of artificial delay. A teaching hook, not a real parameter. */
  _delay?: number;
  /** Force an HTTP status. A teaching hook. */
  _fail?: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean };
}

/** Drop undefined/empty values so the URL stays readable and cache-friendly. */
function toSearchParams(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '' || value === false) continue;
    params.set(key, String(value));
  }
  const string = params.toString();
  return string ? `?${string}` : '';
}

export function getProducts(query: ProductQuery = {}, signal?: AbortSignal) {
  return request<Paginated<Product>>(`/products${toSearchParams({ ...query })}`, { signal });
}

export function getCategories(signal?: AbortSignal) {
  return request<{ data: Array<{ id: string; name: string; count: number; children: Array<{ id: string; name: string; count: number }> }> }>(
    '/categories',
    { signal },
  );
}

export function getProduct(slug: string, signal?: AbortSignal) {
  return request<{ data: Product }>(`/products/${slug}`, { signal });
}
