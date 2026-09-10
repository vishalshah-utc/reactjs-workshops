import { SearchIcon, XIcon } from 'lucide-react';
import type { ProductFilters } from '@/lib/filters';
import { SORT_OPTIONS, type SortKey } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductToolbarProps {
  filters: ProductFilters;
  /**
   * One callback for every control, taking a partial update.
   *
   * The alternative is five props — `onSearchChange`, `onSortChange`,
   * `onInStockChange`… — and a sixth every time a filter is added. A single
   * `onChange(patch)` keeps the surface flat and makes the parent's update
   * a one-liner: `setFilters(prev => ({ ...prev, ...patch }))`.
   */
  onChange: (patch: Partial<ProductFilters>) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
  /** True while the debounce is pending — the input has text the API has not seen. */
  isSearching?: boolean;
}

export function ProductToolbar({
  filters, onChange, onReset, resultCount, totalCount, isSearching = false,
}: ProductToolbarProps) {
  // DERIVED, not state. Recomputed each render from the filters themselves,
  // so it can never disagree with what the controls are showing.
  const isFiltered =
    filters.search !== '' ||
    filters.categoryId !== 'all' ||
    filters.sort !== 'featured' ||
    filters.inStockOnly ||
    filters.onSaleOnly;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search products, brands, categories"
            aria-label="Search products"
            className="pl-8"
            /* CONTROLLED: the value comes from state and every keystroke goes
               back up through onChange. React owns what is on screen. */
            value={filters.search}
            onChange={(event) => onChange({ search: event.target.value })}
          />
        </div>

        <Select value={filters.sort} onValueChange={(value) => onChange({ sort: value as SortKey })}>
          <SelectTrigger className="w-[190px]" aria-label="Sort products">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <XIcon />
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="in-stock"
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange({ inStockOnly: checked === true })}
          />
          <Label htmlFor="in-stock" className="cursor-pointer font-normal">In stock only</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="on-sale"
            checked={filters.onSaleOnly}
            onCheckedChange={(checked) => onChange({ onSaleOnly: checked === true })}
          />
          <Label htmlFor="on-sale" className="cursor-pointer font-normal">On sale</Label>
        </div>

        <p className="text-muted-foreground ml-auto text-sm" aria-live="polite">
          {isSearching
            ? 'Searching…'
            : resultCount === totalCount
              ? `${totalCount} products`
              : `Showing ${resultCount} of ${totalCount}`}
        </p>
      </div>
    </div>
  );
}
