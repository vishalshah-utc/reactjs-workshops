import type { Key, ReactNode } from 'react';

// TODO(lab-3.3): a GENERIC table — Column<T> { key: Extract<keyof T, string> | (string & Record<never, never>); header; render?: (row: T) => ReactNode;
// sortValue?: (row: T) => string | number }, rows/columns/getRowKey props, optional sort with aria-sort on the <th>
export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  rows: readonly T[];
  columns: readonly Column<T>[];
  getRowKey: (row: T) => Key;
  caption: string;
}

/** Placeholder: renders nothing. TeamPage still draws its own <Table>. */
export function DataTable<T>(_props: DataTableProps<T>) {
  return null;
}
