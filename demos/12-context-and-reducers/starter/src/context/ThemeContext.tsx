import type { ReactNode } from 'react';

/**
 * Light/dark for the whole app. Bootstrap 5.3 recolours everything from ONE
 * attribute — <html data-bs-theme="dark"> — so the provider owns a value and
 * mirrors it onto the document in an effect.
 */
// TODO(lab-2.1): createContext<ThemeContextValue | undefined>(undefined); ThemeProvider with useState + an effect that sets document.documentElement.dataset.bsTheme; useTheme() that THROWS outside the provider
export function ThemeProvider({ children }: { children: ReactNode }) {
  return children;
}
