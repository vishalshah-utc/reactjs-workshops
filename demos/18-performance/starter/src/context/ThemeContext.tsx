import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';

/** What the user CHOSE. 'system' means "follow the OS" — and keep following it if the OS changes. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** What is actually on <html data-bs-theme>: a preference RESOLVED against the OS. */
export type Theme = 'light' | 'dark';

/** The inline script in index.html reads the SAME key before React loads — that is what stops the flash. */
export const THEME_STORAGE_KEY = 'shopscope.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

interface ThemeContextValue {
  /** The user's choice — what the header's control shows as pressed. */
  preference: ThemePreference;
  /** What the page is showing right now. */
  theme: Theme;
  setPreference: (next: ThemePreference) => void;
}

/**
 * `undefined` on purpose: a "sensible" default would make a component rendered OUTSIDE the
 * provider look like it works while its control does nothing. useTheme() turns it into an error.
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** `unknown` in, a narrowed union out — the only way a string from localStorage becomes a ThemePreference. */
function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system'; // storage disabled (Safari private mode throws) — a preference is a nicety, not a requirement
  }
}

// --- The OS colour scheme is an EXTERNAL store: it changes without React knowing, and React must re-render when it does. ---
// useSyncExternalStore wants exactly two things: how to subscribe, and how to read the current value.
function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function getSystemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Owns the theme. Bootstrap 5.3 recolours everything from ONE attribute, <html data-bs-theme>, so React owns
 * the state and the DOM attribute is a side effect of it. Three sources feed it: the user's choice (state,
 * persisted), the OS (an external store), and — before any of this runs — the inline script in index.html.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // A lazy initialiser: localStorage is read ONCE, on mount, not on every render.
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const systemPrefersDark = useSyncExternalStore(subscribeToSystemTheme, getSystemPrefersDark);

  // DERIVED during render — not a second piece of state that could disagree with the first.
  const theme: Theme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  useEffect(() => {
    document.documentElement.dataset.bsTheme = theme; // the DOM follows the state; index.html set the same attribute before first paint
  }, [theme]);

  // Persist in the EVENT, not in an effect: writing storage is a consequence of the user's action, not of a render.
  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice lasts for this tab only */
    }
  }, []);

  // The value is an OBJECT. Without useMemo it would be a new object on every provider render,
  // and every consumer would re-render even when nothing in it changed.
  const value = useMemo(() => ({ preference, theme, setPreference }), [preference, theme, setPreference]);

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
