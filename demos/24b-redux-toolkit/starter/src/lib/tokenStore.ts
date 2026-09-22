import type { User } from '../types';

const KEYS = {
  access: 'shopscope.accessToken',
  refresh: 'shopscope.refreshToken',
  user: 'shopscope.user',
} as const;

/** Fired whenever auth state changes, so the UI can react from anywhere — including from an interceptor. */
export const AUTH_CHANGED = 'shopscope:auth-changed';

function emit() {
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  getUser(): User | null;
  isAuthenticated(): boolean;
  set(values: { accessToken?: string; refreshToken?: string; user?: User }): void;
  clear(): void;
}

/**
 * localStorage is readable by ANY script on the page — an XSS anywhere in the
 * app or its dependencies can steal these tokens. In production, prefer an
 * httpOnly cookie issued by your own backend. We use localStorage here because
 * DummyJSON is token-based and this is a workshop; the trade-off is stated,
 * not hidden.
 */
export const tokenStore: TokenStore = {
  getAccess: () => localStorage.getItem(KEYS.access),
  getRefresh: () => localStorage.getItem(KEYS.refresh),

  getUser() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.user) ?? 'null') as User | null;
    } catch {
      return null; // a corrupted entry means "signed out", not "crash"
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem(KEYS.access));
  },

  set({ accessToken, refreshToken, user }) {
    if (accessToken) localStorage.setItem(KEYS.access, accessToken);
    if (refreshToken) localStorage.setItem(KEYS.refresh, refreshToken);
    if (user) localStorage.setItem(KEYS.user, JSON.stringify(user));
    emit();
  },

  clear() {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    emit();
  },
};
