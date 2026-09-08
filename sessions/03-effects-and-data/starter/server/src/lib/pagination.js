/**
 * Two pagination styles, offered side by side ON PURPOSE.
 *
 * Session 5 has participants build offset pagination for the admin tables and
 * cursor pagination for the storefront's infinite scroll, then discuss why a
 * real product ships both: offset gives you page numbers and a total count;
 * cursor stays correct when rows are being inserted while you scroll.
 */

export function parsePageParams(query, { defaultLimit = 24, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? defaultLimit, 10) || defaultLimit, 1), maxLimit);
  const page = Math.max(Number.parseInt(query.page ?? 1, 10) || 1, 1);
  return { page, limit, offset: (page - 1) * limit };
}

/** Offset pagination — page numbers and a total. Used by the admin tables. */
export function paginate(rows, query, opts) {
  const { page, limit, offset } = parsePageParams(query, opts);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data: rows.slice(offset, offset + limit),
    meta: {
      page, limit, total, totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Cursor pagination — stable under concurrent inserts. Used by the storefront
 * listing so `useInfiniteQuery` never shows a duplicate or skips a row.
 * The cursor is an opaque base64url of the last row's id; opaque on purpose,
 * so nobody builds a client that parses it.
 */
export function paginateCursor(rows, query, { defaultLimit = 24, maxLimit = 100 } = {}) {
  const limit = Math.min(Math.max(Number.parseInt(query.limit ?? defaultLimit, 10) || defaultLimit, 1), maxLimit);
  let start = 0;
  if (query.cursor) {
    const afterId = Buffer.from(String(query.cursor), 'base64url').toString('utf8');
    const foundAt = rows.findIndex((r) => r.id === afterId);
    if (foundAt === -1) {
      const err = new Error('Unknown or expired cursor');
      err.status = 400;
      err.code = 'INVALID_CURSOR';
      throw err;
    }
    start = foundAt + 1;
  }
  const slice = rows.slice(start, start + limit);
  const last = slice[slice.length - 1];
  const hasMore = start + limit < rows.length;
  return {
    data: slice,
    meta: {
      limit,
      nextCursor: hasMore && last ? Buffer.from(last.id, 'utf8').toString('base64url') : null,
      hasMore,
    },
  };
}

/** Generic multi-key sorter driven by a `sort=field:dir` query param. */
export function applySort(rows, sortParam, allowed, fallback) {
  const spec = String(sortParam ?? fallback ?? '');
  const [field, dirRaw] = spec.split(':');
  if (!allowed.includes(field)) {
    return fallback && spec !== fallback ? applySort(rows, fallback, allowed, null) : rows;
  }
  const dir = dirRaw === 'desc' ? -1 : 1;
  return rows.slice().sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return (typeof av === 'string' ? av.localeCompare(bv) : av < bv ? -1 : 1) * dir;
  });
}
