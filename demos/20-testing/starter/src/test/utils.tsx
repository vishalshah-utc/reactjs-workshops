import type { ReactElement } from 'react';
import type { RenderResult } from '@testing-library/react';

/**
 * Every test in this project renders through ONE function. The alternative is
 * a provider wrapper copy-pasted into forty files — and forty files to edit
 * the day the app gains a provider.
 */

// TODO(lab-1.2): build renderWithProviders(ui, { route, client, withRouter }) — a FRESH
// QueryClient per test (retry: false), then ThemeProvider, ToastProvider and an optional
// MemoryRouter, returning RTL's result plus the client and a userEvent.setup() session.
export function renderWithProviders(_ui: ReactElement): RenderResult {
  throw new Error('renderWithProviders is not built yet — Lab 1.');
}
