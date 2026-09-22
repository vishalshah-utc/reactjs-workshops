import { z } from 'zod';
import type { ProductDraft } from '../types';

// =============================================================== Product form
// Hand-rolled: a PURE function from values to errors. Testable without
// rendering anything, reusable on a server, impossible to get out of sync.

/** At most one message per field, keys checked against the draft type — a typo is a compile error. */
export type ProductErrors = Partial<Record<keyof ProductDraft, string>>;

export const PRODUCT_EMPTY: ProductDraft = { title: '', price: NaN, category: '', stock: 10, description: '' };

export function validateProduct(values: ProductDraft): ProductErrors {
  const errors: ProductErrors = {};
  if (values.title.trim().length < 2) errors.title = 'Give it a name of at least 2 characters.';
  if (!(values.price > 0)) errors.price = 'Price must be more than zero.';
  if (!values.category) errors.category = 'Pick a category.';
  if (!Number.isInteger(values.stock) || values.stock < 0) errors.stock = 'Stock must be a whole number, zero or more.';
  if (values.description.length > 300) errors.description = 'Keep it under 300 characters.';
  return errors;
}

// ================================================================ Sign-up form
// A zod SCHEMA: rules as data, the TYPE of the values derived from it, one
// readable block instead of a dozen scattered ones. It does not know whether
// the form keeps its state in useState or in react-hook-form.

export interface Option<T extends string = string> {
  value: T;
  label: string;
}

const GENDER_VALUES = ['female', 'male', 'other'] as const;
export type Gender = (typeof GENDER_VALUES)[number];

export const GENDERS: Option<Gender>[] = [
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

export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.'),
  lastName: z.string().trim().min(1, 'Last name is required.'),
  email: z.email("That doesn't look like an email address."),
  password: z.string().min(8, 'Use at least 8 characters.').regex(/\d/, 'Include at least one number.'),
  age: z.number({ error: 'Age is required.' }).int('Whole years, please.').min(18, 'You must be 18 or over.').max(120, 'That seems unlikely.'),
  birthDate: z.string().min(1, 'Pick your date of birth.'),
  // '' is what an untouched radio group holds; the refine is what makes it an error.
  gender: z.enum(GENDER_VALUES).or(z.literal('')).refine((v) => v !== '', 'Pick one.'),
  country: z.string().min(1, 'Pick a country.'),
  interests: z.array(z.string()).min(1, 'Follow at least one category.'),
  budget: z.number().min(0).max(5000),
  newsletter: z.boolean(),
  // z.boolean() alone would accept `false`. The refine says exactly what we mean.
  terms: z.boolean().refine((v) => v, 'You must accept the terms.'),
  avatar: z
    .instanceof(File)
    .nullable()
    .refine((f) => !f || f.type.startsWith('image/'), 'Images only, please.')
    .refine((f) => !f || f.size <= 2_000_000, 'Keep it under 2 MB.'),
});

/** The form's values, DERIVED from the schema — one source of truth for rules and type. */
export type SignupValues = z.input<typeof signupSchema>;

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

// ---------------------------------------------------------------- Demo 21
// A React Action is handed the browser's own `FormData`, which holds strings
// and Files and nothing else. The coercion react-hook-form used to do has to
// happen somewhere, and "somewhere" is a pure function — testable on its own,
// and the same code a server would run.

/** One message per field — the shape the form renders. */
export type SignupErrors = Partial<Record<keyof SignupValues | 'form', string>>;

// TODO(lab-1.1): parseSignupFormData(formData) → SignupValues. Watch the three awkward
// reads: getAll('interests') for a checkbox GROUP, `get('terms') === 'on'` because an
// unchecked box sends nothing at all, and a file input that always sends a File — with
// size 0 when it is empty. An empty age box must become NaN, not 0.
export function parseSignupFormData(_formData: FormData): SignupValues {
  return SIGNUP_EMPTY;
}

// TODO(lab-1.1): validateSignup(values) → the errors to render, or null when it is clean.
// Run `signupSchema.safeParse`, then flatten with `z.flattenError(...).fieldErrors` and
// keep the FIRST message per field — the form shows one line, not three.
export function validateSignup(_values: SignupValues): SignupErrors | null {
  return null;
}
