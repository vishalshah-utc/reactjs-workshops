import type { User } from '../types';

/**
 * Where the tokens live. Lab 1.1: localStorage-backed get/set/clear, an
 * isAuthenticated() check, and an AUTH_CHANGED event so non-React code (an
 * interceptor) can tell the UI something happened.
 */
export const AUTH_CHANGED = 'shopscope:auth-changed';

export interface TokenStore {
  getAccess(): string | null;
  getRefresh(): string | null;
  getUser(): User | null;
  isAuthenticated(): boolean;
  set(values: { accessToken?: string; refreshToken?: string; user?: User }): void;
  clear(): void;
}

// TODO(lab-1.1): getAccess / getRefresh / getUser / isAuthenticated / set({ accessToken, refreshToken, user }) / clear(), emitting AUTH_CHANGED
export const tokenStore: TokenStore = {
  getAccess: () => null,
  getRefresh: () => null,
  getUser: () => null,
  isAuthenticated: () => false,
  set() {},
  clear() {},
};
