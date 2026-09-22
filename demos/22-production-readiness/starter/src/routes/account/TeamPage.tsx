import { useState, type ReactNode } from 'react';
import { Badge, Card, Form, Image, InputGroup } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listUsers } from '../../api/services/users';
import { DataTable, type Column } from '../../components/DataTable';
import type { DirectoryUser, Role } from '../../types';

// `satisfies`: check the shape WITHOUT widening. Typed as Record<Role, string> the values would become `string`;
// with satisfies they stay the literals 'danger' | 'warning' | 'secondary' — and a missing role is still an error.
const ROLE_VARIANT = { admin: 'danger', moderator: 'warning', user: 'secondary' } satisfies Record<Role, string>;

/** The matching part of `text`, wrapped in <mark>. Pure, and cheap — it is the ARRAY around it that costs. */
function highlight(text: string, term: string): ReactNode {
  if (!term) return text;
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  if (at === -1) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark className="p-0">{text.slice(at, at + term.length)}</mark>
      {text.slice(at + term.length)}
    </>
  );
}

export async function teamLoader({ request }: LoaderFunctionArgs) {
  return { users: await listUsers({ limit: 12, signal: request.signal }) };
}

/** Admin-only. The guard is on the ROUTE (requireRole in router.tsx), not in here. */
export function TeamPage() {
  const { users } = useLoaderData<typeof teamLoader>();
  const [filter, setFilter] = useState('');

  const needle = filter.trim().toLowerCase();
  const rows = needle ? users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(needle)) : users;

  /**
   * The table as DATA: what each column is called, which property (or computation) fills it, how to draw and sort it.
   * `satisfies Column<DirectoryUser>[]` type-checks every `render` and `sortValue` against the row type — `row.compnay`
   * is an error here — while keeping the `key` literals.
   *
   * This array used to sit at MODULE scope, which is the best kind of memoisation: a value that is created once
   * because it never depended on a render. Highlighting the search term changed that — `render` now closes over
   * `filter` — so it has to move inside the component, where a new array is built on every render and
   * `DataTable`'s internal `useMemo([rows, columns, sort])` therefore re-sorts every time.
   * Under the React Compiler (Lab 6) this array is cached on `filter` automatically; by hand it is a `useMemo`.
   */
  const columns = [
    { key: 'image', header: '', width: 48, render: (row) => <Image src={row.image} roundedCircle width={32} height={32} alt="" className="bg-body-secondary" /> },
    {
      key: 'name',
      header: 'Name',
      render: (row) => highlight(`${row.firstName} ${row.lastName}`, needle),
      sortValue: (row) => `${row.lastName} ${row.firstName}`,
    },
    { key: 'email', header: 'Email', className: 'text-muted', render: (row) => highlight(row.email, needle), sortValue: (row) => row.email },
    { key: 'company', header: 'Company', className: 'text-muted', render: (row) => row.company?.title ?? '—', sortValue: (row) => row.company?.title ?? '' },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge bg={ROLE_VARIANT[row.role]} className="text-capitalize">
          {row.role}
        </Badge>
      ),
      sortValue: (row) => row.role,
    },
  ] satisfies Column<DirectoryUser>[];

  return (
    <Card>
      <Card.Header className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
        <span className="fw-semibold">Team directory</span>
        <InputGroup size="sm" style={{ maxWidth: 260 }}>
          <InputGroup.Text>
            <Search />
          </InputGroup.Text>
          <Form.Control type="search" placeholder="Find a person" aria-label="Filter the directory" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </InputGroup>
      </Card.Header>
      {/* T is inferred from `rows` — DirectoryUser — so every column callback above already knew its row type. */}
      <DataTable rows={rows} columns={columns} getRowKey={(user) => user.id} caption="Team members, sortable by name, email, company and role" emptyMessage="Nobody matches that." />
    </Card>
  );
}
