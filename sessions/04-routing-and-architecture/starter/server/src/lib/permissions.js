/**
 * Role → permission mapping. This is the source of truth for BOTH the API's
 * 403s and the frontend's `<Can permission="...">` component in Session 6.
 *
 * The frontend gets this list at login (in `/api/auth/me`) so the UI can hide
 * what a user can't do. The API checks it again on every request, because
 * hiding a button is UX — it is not security. That distinction is the entire
 * point of Session 6 Lab 4.
 */

export const PERMISSIONS = [
  'product:read', 'product:create', 'product:update', 'product:delete',
  'order:read:own', 'order:read', 'order:update_status', 'order:cancel', 'order:refund',
  'review:create', 'review:moderate',
  'return:create', 'return:read', 'return:approve',
  'customer:read', 'customer:impersonate',
  'promotion:read', 'promotion:create', 'promotion:update', 'promotion:delete',
  'user:read', 'user:invite', 'user:update_role', 'user:deactivate',
  'inventory:read', 'inventory:adjust',
  'audit:read', 'report:read', 'settings:update', 'flag:toggle',
];

const CUSTOMER = ['product:read', 'order:read:own', 'review:create', 'return:create'];

const CSR = [
  ...CUSTOMER,
  'order:read', 'order:cancel', 'customer:read', 'customer:impersonate',
  'return:read', 'return:approve', 'review:moderate',
];

const CATALOG_MANAGER = [
  ...CUSTOMER,
  'product:create', 'product:update', 'product:delete',
  'inventory:read', 'inventory:adjust',
  'promotion:read', 'promotion:create', 'promotion:update', 'promotion:delete',
  'review:moderate', 'report:read',
];

const FULFILMENT = [
  ...CUSTOMER,
  'order:read', 'order:update_status', 'order:cancel',
  'inventory:read', 'inventory:adjust', 'return:read',
];

export const ROLE_PERMISSIONS = {
  CUSTOMER,
  CSR,
  CATALOG_MANAGER,
  FULFILMENT,
  ADMIN: PERMISSIONS,
};

/** Union of every role's permissions. A user may hold more than one role. */
export function permissionsFor(roles = []) {
  const set = new Set();
  for (const role of roles) for (const p of ROLE_PERMISSIONS[role] ?? []) set.add(p);
  return [...set].sort();
}

export function can(roles, permission) {
  return roles.some((r) => (ROLE_PERMISSIONS[r] ?? []).includes(permission));
}

/** Staff see the back-office; customers see the storefront. Drives the S6 fork. */
export const STAFF_ROLES = ['CSR', 'CATALOG_MANAGER', 'FULFILMENT', 'ADMIN'];
export const isStaff = (roles = []) => roles.some((r) => STAFF_ROLES.includes(r));
