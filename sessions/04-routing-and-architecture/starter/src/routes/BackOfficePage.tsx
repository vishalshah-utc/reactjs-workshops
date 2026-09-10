import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { LayoutDashboardIcon } from 'lucide-react';

/**
 * The back-office, at its own URL.
 *
 * ── Why this route is the one that gets code-split ─────────────────────────
 *
 * Most visitors to a storefront never open an admin screen. Every byte of this
 * surface that ships in the main bundle is a byte every customer downloads and
 * never executes — and by Session 9 this page pulls in a data grid, a chart
 * library and a rich text editor.
 *
 * `React.lazy` turns the import into a dynamic `import()`, which the bundler
 * splits into its own chunk and the browser fetches only when this route is
 * first visited. That is why this file is a DEFAULT export: `lazy` takes a
 * function returning a promise for a module with a `default`.
 *
 * Lab 4 wires it up. Open the network tab, click Back-office, and watch a
 * chunk arrive that was not there before.
 */
export default function BackOfficePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Back-office"
        description="Products, orders and stock. Moves to the API in Session 5, and gets locked down behind roles in Session 6."
      />
      <EmptyState
        title="Back-office lands in Session 5"
        description="This route exists now so Lab 4 has something worth code-splitting. Check the network tab — this chunk was not downloaded until you clicked."
        icon={<LayoutDashboardIcon className="text-muted-foreground size-8" />}
      />
    </div>
  );
}
