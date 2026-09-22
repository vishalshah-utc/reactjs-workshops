import type { Metadata } from 'next';
import './globals.css';

/**
 * Metadata as DATA, resolved on the server and rendered into the HTML before
 * it is sent. Compare with the Vite app's <PageMeta>, which does the same job
 * in the browser — after the crawler has already read an empty document.
 */
export const metadata: Metadata = {
  title: 'ShopScope (Next.js mini)',
  description: 'The ShopScope product list, rendered on the server.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
