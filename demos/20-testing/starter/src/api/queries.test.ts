// TODO(lab-3.5): test the cache keys as the pure functions they are — listOptionsFrom
// reading only the filters that identify a page and IGNORING ?edit/?flash/?view, 'all'
// meaning no category, a clamped page, the nesting in productKeys, and
// productsInfiniteQuery's getNextPageParam including the last page returning undefined.
describe('listOptionsFrom', () => {
  it.todo('reads the filters the catalogue is actually identified by');
  it.todo('IGNORES the params that are about the UI, not about the data');
  it.todo("treats the strip's 'all' and no category at all as the same request");
});

describe('productsInfiniteQuery', () => {
  it.todo('asks for the next skip while there is more');
  it.todo('returns undefined on the last page — which is what hasNextPage reads');
});
