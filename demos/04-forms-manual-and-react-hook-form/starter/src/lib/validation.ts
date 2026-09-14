import type { ProductDraft } from '../types';

/**
 * Validation lives HERE, not in components: a pure function from values to
 * errors (Lab 2.1), and later a zod schema (Lab 4.1).
 */

/** At most one message per field, keys checked against the draft type — a typo is a compile error. */
export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export const PRODUCT_EMPTY: ProductDraft = { title: '', price: NaN, category: '', stock: 10, description: '' };

// TODO(lab-2.1): validateProduct(values: ProductDraft): ProductErrors — title ≥ 2 chars, price > 0, category, stock a whole number ≥ 0
export function validateProduct(_values: ProductDraft): ProductErrors {
  return {};
}

export interface Option {
  value: string;
  label: string;
}

export const GENDERS: Option[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other / prefer not to say' },
];

export const COUNTRIES: Option[] = [
  { value: 'IN', label: 'India' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'US', label: 'United States' },
  { value: 'DE', label: 'Germany' },
  { value: 'AU', label: 'Australia' },
];

/** The product categories a shopper can follow — the same slugs DummyJSON uses. */
export const INTERESTS: Option[] = [
  { value: 'beauty', label: 'Beauty' },
  { value: 'fragrances', label: 'Fragrances' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'laptops', label: 'Laptops' },
  { value: 'smartphones', label: 'Smartphones' },
];

/** The sign-up form's values. Lab 4.1 derives this from the zod schema instead. */
export interface SignupValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  age: number;
  birthDate: string;
  gender: '' | 'female' | 'male' | 'other';
  country: string;
  interests: string[];
  budget: number;
  newsletter: boolean;
  terms: boolean;
  avatar: File | null;
}

export const SIGNUP_EMPTY: SignupValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  age: NaN,
  birthDate: '',
  gender: '',
  country: '',
  interests: [],
  budget: 500,
  newsletter: true,
  terms: false,
  avatar: null,
};

// TODO(lab-4.1): export const signupSchema = z.object({ … }) — the rules as data; `export type SignupValues = z.input<typeof signupSchema>`; then zodResolver(signupSchema) in SignupForm
