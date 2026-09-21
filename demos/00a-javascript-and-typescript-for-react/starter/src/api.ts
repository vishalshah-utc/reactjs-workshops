/**
 * The network boundary. Everything that crosses it is `unknown` until we say
 * otherwise, and every promise says what it resolves to. Demo 6 grows this
 * file into an axios instance with interceptors; the shapes stay.
 */

export const API_BASE = 'https://dummyjson.com';

// TODO(lab-6.1): ProductListResponse, CategorySummary, ApiError + apiError(), and the isApiError type guard

// TODO(lab-6.2): fetchProducts and fetchProduct — URL + searchParams, response.ok, Promise<ProductListResponse>, AbortSignal

// TODO(lab-6.3): fetchCategories; fetchCatalogue with Promise.all; Catalogue = Awaited<ReturnType<typeof fetchCatalogue>>
