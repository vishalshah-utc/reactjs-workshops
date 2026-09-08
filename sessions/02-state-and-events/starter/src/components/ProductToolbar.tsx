import { SearchIcon, XIcon } from 'lucide-react';
import type { ProductFilters } from '@/lib/filters';
import { SORT_OPTIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductToolbarProps {
  filters: ProductFilters;
  /**
   * One callback taking a PARTIAL update, rather than five separate ones.
   * Adding a sixth filter then costs nothing here or in the parent.
   */
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
}

export function ProductToolbar({ filters, onChange, onReset, resultCount, totalCount }: ProductToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          {/*
            ← THIS ONE IS DONE, as the worked example of a CONTROLLED input.
            It needs BOTH halves: `value` from state, and `onChange` sending
            every keystroke back up. With only `value` it is read-only and
            React warns; with only `onChange` the parent never sees the text.
            Copy this shape for the sort dropdown and the checkboxes below.
          */}
          <Input
            type="search"
            placeholder="Search products, brands, categories"
            aria-label="Search products"
            className="pl-8"
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </div>

        {/*
          TODO(lab-2.2): The options render, but choosing one does nothing —
          it is not controlled. Radix Select uses different prop names from an
          <input>, same idea:
            value={filters.sort}
            onValueChange={(value) => onChange({ sort: value as SortKey })}
          You will need to import `type SortKey` from '@/types'.
        */}
        <Select>
          <SelectTrigger className="w-[190px]" aria-label="Sort products">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/*
          TODO(lab-2.2): Show this only when something is actually filtered.
          DERIVE that — `filters.search !== '' || filters.categoryId !== 'all' || …`
          — do not add a useState for it. A stored copy would go stale the
          moment a filter changed.
        */}
        <Button variant="ghost" size="sm" onClick={onReset}>
          <XIcon />
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/*
          TODO(lab-2.2): Wire both checkboxes.
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ inStockOnly: checked === true })}
          The `=== true` matters: Radix checkboxes are tri-state and can hand
          you the string "indeterminate", which is truthy.
        */}
        <div className="flex items-center gap-2">
          <Checkbox id="in-stock" />
          <Label htmlFor="in-stock" className="cursor-pointer font-normal">In stock only</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="on-sale" />
          <Label htmlFor="on-sale" className="cursor-pointer font-normal">On sale</Label>
        </div>

        {/* `aria-live="polite"` so a screen reader announces the new count
            after filtering, without interrupting what it is already saying. */}
        <p className="text-muted-foreground ml-auto text-sm" aria-live="polite">
          {resultCount === totalCount ? `${totalCount} products` : `${resultCount} of ${totalCount} products`}
        </p>
      </div>
    </div>
  );
}
