// TODO(lab-3.1): test validateProduct and signupSchema with no render at all — the empty
// form reporting EVERY required field at once, an it.each table of the individual rules,
// the boundaries that must pass (title 'ab', stock 0, a 300-character description), purity,
// and zod's per-field rules through signupSchema.shape.
describe('validateProduct', () => {
  it.todo('accepts a complete draft');
  it.todo('rejects the empty form on every required field at once');
  it.todo('rejects each invalid field, as a table');
  it.todo('accepts the boundaries it is meant to accept');
  it.todo('is pure: it does not touch the values it is given');
});

describe('signupSchema', () => {
  it.todo('parses a complete sign-up');
  it.todo('gives the password rules their own messages');
  it.todo('treats an untouched radio group as an error, not as a value');
});
