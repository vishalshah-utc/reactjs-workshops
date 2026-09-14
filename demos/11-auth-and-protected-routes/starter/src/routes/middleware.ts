import { createContext, type MiddlewareFunction } from 'react-router';
import type { User } from '../types';

/**
 * Typed handle for the current user, shared from middleware to every loader
 * beneath it. NOTE: this is React Router's createContext, not React's — a
 * typed KEY for the middleware context, not a provider.
 */
export const userContext = createContext<User | null>(null);

/** Lets everyone through, as a guest. Lab 4.1 makes it a guard. */
// TODO(lab-4.1): redirect to /login?redirectTo=… when signed out; put the user in context; requireRole(...roles: Role[]) factory → 403
export const authMiddleware: MiddlewareFunction = async ({ context }) => {
  context.set(userContext, { id: 0, username: 'guest', firstName: 'Guest', lastName: '', email: '', image: '', role: 'user' });
};

export function requireRole(): MiddlewareFunction {
  return async () => {};
}
