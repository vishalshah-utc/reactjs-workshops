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
// The SAME schema, read out of a FormData instead of out of react-hook-form.
//
// A React Action is handed the browser's own `FormData`, and FormData holds
// strings and Files and nothing else — there is no `valueAsNumber` here, no
// `e.target.checked`, no library that coerced anything on the way in. So the
// coercion has to happen once, in a pure function, before the schema sees it.
// That function is trivially testable and would run unchanged on a server.

/** One message per field — the shape the form renders. */
export type SignupErrors = Partial<Record<keyof SignupValues | 'form', string>>;

/**
 * FormData → the values the schema expects.
 *
 * The three reads worth knowing:
 *   getAll('interests')  — a checkbox GROUP is many entries under one name
 *   get('terms') === 'on' — an unchecked box sends NOTHING, so `null` is `false`
 *   get('avatar') instanceof File — a file input's entry is a File, empty name and all
 */
export function parseSignupFormData(formData: FormData): SignupValues {
  const text = (key: string) => String(formData.get(key) ?? '');
  const avatar = formData.get('avatar');

  return {
    firstName: text('firstName'),
    lastName: text('lastName'),
    email: text('email'),
    password: text('password'),
    // '' → NaN, which the schema rejects with "Age is required." — not 0, which it would accept.
    age: text('age') === '' ? NaN : Number(text('age')),
    birthDate: text('birthDate'),
    gender: text('gender') as SignupValues['gender'],
    country: text('country'),
    interests: formData.getAll('interests').map(String),
    budget: Number(text('budget') || 0),
    newsletter: formData.get('newsletter') === 'on',
    terms: formData.get('terms') === 'on',
    // An empty file input still sends a File — with size 0 and an empty name.
    avatar: avatar instanceof File && avatar.size > 0 ? avatar : null,
  };
}

/** Validate a submitted sign-up. Returns the errors to render, or `null` when it is clean. */
export function validateSignup(values: SignupValues): SignupErrors | null {
  const result = signupSchema.safeParse(values);
  if (result.success) return null;

  // zod 4's flattener: `fieldErrors` is `{ email: ['…', '…'] }`. The form shows
  // one message per field, so take the first — the rest say the same thing twice.
  const fieldErrors = z.flattenError(result.error).fieldErrors as Record<string, string[] | undefined>;
  return Object.fromEntries(Object.entries(fieldErrors).map(([key, messages]) => [key, messages?.[0]])) as SignupErrors;
}
