import { describe, expect, it } from 'vitest';
import { PRODUCT_EMPTY, SIGNUP_EMPTY, signupSchema, validateProduct } from './validation';
import type { ProductDraft } from '../types';

/**
 * No `render`, no provider, no DOM. These are the cheapest tests in the suite
 * and the ones that catch the most: a validation rule is a CONTRACT, and a
 * contract is exactly what a test is for.
 */
describe('validateProduct', () => {
  const valid: ProductDraft = { title: 'Mascara', price: 9.99, category: 'beauty', stock: 3, description: 'Nice.' };

  it('accepts a complete draft', () => {
    expect(validateProduct(valid)).toEqual({});
  });

  it('rejects the empty form on every required field at once', () => {
    // Not "reports an error" — reports ALL of them. A validator that stops at
    // the first failure makes the user fix the form one field per submit.
    expect(validateProduct(PRODUCT_EMPTY)).toEqual({
      title: 'Give it a name of at least 2 characters.',
      price: 'Price must be more than zero.',
      category: 'Pick a category.',
    });
  });

  it.each([
    ['a title of only whitespace', { title: '   ' }, 'title'],
    ['a price of zero', { price: 0 }, 'price'],
    ['a negative price', { price: -1 }, 'price'],
    ['a fractional stock level', { stock: 1.5 }, 'stock'],
    ['a negative stock level', { stock: -1 }, 'stock'],
    ['a description over 300 characters', { description: 'x'.repeat(301) }, 'description'],
  ])('rejects %s', (_name, patch, field) => {
    // it.each turns six near-identical tests into one table. The failure output
    // still names the case, so a red run tells you WHICH rule broke.
    expect(validateProduct({ ...valid, ...patch })).toHaveProperty(field);
  });

  it('accepts the boundaries it is meant to accept', () => {
    expect(validateProduct({ ...valid, title: 'ab', stock: 0, description: 'x'.repeat(300) })).toEqual({});
  });

  it('is pure: it does not touch the values it is given', () => {
    const values = { ...valid };
    validateProduct(values);
    expect(values).toEqual(valid);
  });
});

describe('signupSchema', () => {
  it('parses a complete sign-up', () => {
    const result = signupSchema.safeParse({
      ...SIGNUP_EMPTY,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily@example.com',
      password: 'correct1horse',
      age: 34,
      birthDate: '1992-04-01',
      gender: 'female',
      country: 'GB',
      interests: ['beauty'],
      terms: true,
    });

    expect(result.success).toBe(true);
  });

  it('gives the password rules their own messages', () => {
    const result = signupSchema.shape.password.safeParse('short');
    expect(result.success).toBe(false);
    // Testing the ONE field, not the whole form: zod's `shape` exposes each
    // rule as a schema of its own, so the test names the rule it is about.
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(['Use at least 8 characters.', 'Include at least one number.']);
  });

  it('treats an untouched radio group as an error, not as a value', () => {
    // '' type-checks (the schema allows it) and must still fail — this is the
    // bug the `.refine` exists for, so this is the test that protects it.
    expect(signupSchema.shape.gender.safeParse('').success).toBe(false);
    expect(signupSchema.shape.gender.safeParse('other').success).toBe(true);
  });

  it('refuses an unaccepted terms checkbox', () => {
    expect(signupSchema.shape.terms.safeParse(false).success).toBe(false);
  });
});
