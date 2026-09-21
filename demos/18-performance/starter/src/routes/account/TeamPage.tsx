import { Badge, Card, Image } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listUsers } from '../../api/services/users';
import { DataTable, type Column } from '../../components/DataTable';
import type { DirectoryUser, Role } from '../../types';

// `satisfies`: check the shape WITHOUT widening. Typed as Record<Role, string> the values would become `string`;
// with satisfies they stay the literals 'danger' | 'warning' | 'secondary' — and a missing role is still an error.
const ROLE_VARIANT = { admin: 'danger', moderator: 'warning', user: 'secondary' } satisfies Record<Role, string>;

/**
 * The table as DATA: what each column is called, which property (or computation) fills it, how to draw and sort it.
 * `satisfies Column<DirectoryUser>[]` type-checks every `render` and `sortValue` against the row type — `row.compnay`
 * is an error here — while keeping the `key` literals. Reorder a column: move a line.
 */
// TODO(lab-3.3): add a "Find a person" input to this page (local state), filter `users` by it, and make the
//   `name` and `email` columns HIGHLIGHT the match. `render` then closes over the filter, so this array can no
//   longer live at module scope — which is the best kind of memoisation, the kind you did not have to write.
//   Move it inside the component and wrap it in `useMemo`, or DataTable's own `useMemo([rows, columns, sort])`
//   re-sorts on every keystroke. Keep `satisfies Column<DirectoryUser>[]`.
// TODO(lab-6.2): delete that `useMemo` once the React Compiler is on, and check the table still sorts once.
const COLUMNS = [
  { key: 'image', header: '', width: 48, render: (row) => <Image src={row.image} roundedCircle width={32} height={32} alt="" className="bg-body-secondary" /> },
  { key: 'name', header: 'Name', render: (row) => `${row.firstName} ${row.lastName}`, sortValue: (row) => `${row.lastName} ${row.firstName}` },
  { key: 'email', header: 'Email', className: 'text-muted', sortValue: (row) => row.email },
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

export async function teamLoader({ request }: LoaderFunctionArgs) {
  return { users: await listUsers({ limit: 12, signal: request.signal }) };
}

/** Admin-only. The guard is on the ROUTE (requireRole in router.tsx), not in here. */
export function TeamPage() {
  const { users } = useLoaderData<typeof teamLoader>();

  return (
    <Card>
      <Card.Header className="fw-semibold">Team directory</Card.Header>
      {/* T is inferred from `rows` — DirectoryUser — so every column callback above already knew its row type. */}
      <DataTable rows={users} columns={COLUMNS} getRowKey={(user) => user.id} caption="Team members, sortable by name, email, company and role" />
    </Card>
  );
}
