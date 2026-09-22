import { describe, expect, it } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/utils';
import { PageMeta } from './PageMeta';

/**
 * A three-line test that answers a question you would otherwise take on
 * trust: does document metadata hoisting actually work in THIS React, in a
 * client-rendered app, with no framework underneath it?
 */
describe('PageMeta', () => {
  it('hoists the title and the description into <head>', async () => {
    renderWithProviders(<PageMeta title="Essence Mascara" description="A very good mascara." />);

    // The <title> was rendered in the middle of the tree; React moved it.
    await waitFor(() => expect(document.title).toBe('Essence Mascara · ShopScope'));
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute('content', 'A very good mascara.');
    expect(document.head.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Essence Mascara · ShopScope');
  });

  it('falls back to the app name, and hides a page from crawlers on request', async () => {
    renderWithProviders(<PageMeta noIndex />);

    await waitFor(() => expect(document.title).toBe('ShopScope — the product explorer'));
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  });

  it('removes its tags again when the route unmounts', async () => {
    const { unmount } = renderWithProviders(<PageMeta title="Sign in" description="Sign in to ShopScope." />);
    await waitFor(() => expect(document.title).toBe('Sign in · ShopScope'));

    unmount();

    // Otherwise every route you visited would leave its description behind.
    await waitFor(() => expect(document.head.querySelector('meta[name="description"]')).toBeNull());
  });
});
