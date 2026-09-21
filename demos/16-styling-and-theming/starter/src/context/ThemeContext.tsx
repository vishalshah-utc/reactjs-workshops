import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

// TODO(lab-3.1): a ThemePreference = 'light' | 'dark' | 'system'. State holds the PREFERENCE; `theme` is DERIVED from it and
// from matchMedia('(prefers-color-scheme: dark)') read through useSyncExternalStore (subscribe + getSnapshot). The context
// value becomes { preference, theme, setPreference }.
// TODO(lab-3.2): persist under THEME_STORAGE_KEY = 'shopscope.theme' — read once in a lazy useState initialiser (narrowed
// with a type guard, try/catch for disabled storage), written in setPreference (the event), not in an effect.
// TODO(lab-3.4): the flash. With persistence on, reload as a dark user: white for a frame, then dark. The fix is not in this
// file — it is an inline <script> in index.html that reads the same key and sets data-bs-theme before first paint.

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

/**
 * `undefined` on purpose: a "sensible" default would make a component rendered OUTSIDE the
 * provider look like it works while its toggle does nothing. useTheme() turns it into an error.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Owns the theme. Bootstrap 5.3 recolours everything from ONE attribute, <html data-bs-theme>,
 * so React owns the state and the DOM attribute is a side effect of it. (Persistence, the OS
 * preference and "no flash on load" are Demo 16's job.)
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme;
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'light' ? 'dark' : 'light')), []);

  // The value is an OBJECT. Without useMemo it would be a new object on every provider render,
  // and every consumer would re-render even when nothing in it changed.
  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  // React 19: the context object is its own provider — no <ThemeContext.Provider> needed.
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The module's public API: components call useTheme(), never useContext(ThemeContext). */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme() must be called inside <ThemeProvider>. Is it wrapping <RouterProvider> in main.tsx?');
  }
  return context;
}
