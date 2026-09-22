import { useMemo, useState, type Key, type ReactNode } from 'react';
import { Table } from 'react-bootstrap';
import { CaretDownFill, CaretUpFill } from 'react-bootstrap-icons';

/**
 * One column of a table over rows of type T. `key` is a property of T — with autocomplete — OR any other string
 * for a column that is computed (`name` from firstName + lastName, an avatar). `keyof T | string` would collapse
 * to plain `string` and lose the autocomplete; intersecting with an empty object type keeps the literal members
 * visible while still admitting any string. An old trick, and the reason design systems' column types look odd.
 */
export interface Column<T> {
  key: Extract<keyof T, string> | (string & Record<never, never>);
  header: ReactNode;
  /** How to draw the cell. Absent → `String(row[key])`, which is fine for text and numbers. */
  render?: (row: T) => ReactNode;
  /** Present → the header is a sort button. Returns the value to compare, so a rendered <Badge> can still sort by its text. */
  sortValue?: (row: T) => string | number;
  className?: string;
  width?: number;
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  /** T is anything, so the table cannot guess which property identifies a row. The caller says. */
  getRowKey: (row: T) => Key;
  caption: string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc';
interface SortState {
  key: string;
  direction: SortDirection;
}

/** The default cell: whatever is at `row[key]`, as text. A computed key with no `render` shows nothing — say so with `render`. */
function defaultCell<T>(row: T, key: string): ReactNode {
  const raw = (row as Record<string, unknown>)[key];
  return raw == null ? '' : String(raw);
}

function compare(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * A GENERIC component: `<DataTable<DirectoryUser> rows columns>` — and T is usually inferred from `rows`, so the
 * caller writes `<DataTable rows={users} …>` and every `render={(row) => …}` knows `row` is a DirectoryUser.
 * `row.compnay` is a compile error at the call site, not a blank cell in production.
 */
export function DataTable<T>({ rows, columns, getRowKey, caption, emptyMessage = 'Nothing to show.' }: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column?.sortValue) return rows;
    const { sortValue } = column;
    const sign = sort.direction === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => sign * compare(sortValue(a), sortValue(b))); // a COPY — never sort a prop in place
  }, [rows, columns, sort]);

  function toggleSort(key: string) {
    setSort((current) => {
      if (current?.key !== key) return { key, direction: 'asc' };
      return current.direction === 'asc' ? { key, direction: 'desc' } : null; // asc → desc → off
    });
  }

  return (
    <Table hover responsive className="mb-0 align-middle">
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => {
            const active = sort?.key === column.key ? sort.direction : undefined;
            return (
              // aria-sort on the <th>, not the button: it describes the column's current order to assistive tech.
              <th key={column.key} scope="col" className={column.className} style={column.width ? { width: column.width } : undefined} aria-sort={active ? (active === 'asc' ? 'ascending' : 'descending') : undefined}>
                {column.sortValue ? (
                  <button type="button" className="btn btn-link p-0 fw-semibold text-reset text-decoration-none" onClick={() => toggleSort(column.key)}>
                    {column.header}
                    {active === 'asc' && <CaretUpFill className="ms-1" aria-hidden="true" />}
                    {active === 'desc' && <CaretDownFill className="ms-1" aria-hidden="true" />}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="text-muted text-center py-4">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sorted.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row) : defaultCell(row, column.key)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
