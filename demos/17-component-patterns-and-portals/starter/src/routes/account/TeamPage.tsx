import { Badge, Card, Image, Table } from 'react-bootstrap';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { listUsers } from '../../api/services/users';
import type { Role } from '../../types';

const ROLE_VARIANT: Record<Role, string> = { admin: 'danger', moderator: 'warning', user: 'secondary' };

export async function teamLoader({ request }: LoaderFunctionArgs) {
  return { users: await listUsers({ limit: 12, signal: request.signal }) };
}

/** Admin-only. The guard is on the ROUTE (requireRole in router.tsx), not in here. */
export function TeamPage() {
  const { users } = useLoaderData<typeof teamLoader>();

  // TODO(lab-3.3): replace the hand-written <Table> with <DataTable rows={users} columns={COLUMNS} getRowKey>, COLUMNS typed with `satisfies Column<DirectoryUser>[]`
  return (
    <Card>
      <Card.Header className="fw-semibold">Team directory</Card.Header>
      <Table hover responsive className="mb-0 align-middle">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Email</th>
            <th>Company</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={{ width: 48 }}>
                <Image src={user.image} roundedCircle width={32} height={32} alt="" className="bg-body-secondary" />
              </td>
              <td>
                {user.firstName} {user.lastName}
              </td>
              <td className="text-muted">{user.email}</td>
              <td className="text-muted">{user.company?.title}</td>
              <td>
                <Badge bg={ROLE_VARIANT[user.role] ?? 'secondary'} className="text-capitalize">
                  {user.role}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
