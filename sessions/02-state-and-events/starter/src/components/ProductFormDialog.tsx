import { useState } from 'react';
import type { Product, ProductDraft, ProductDraftErrors } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const emptyDraft: ProductDraft = {
  name: '', brandName: '', categoryId: '', price: '', stockQuantity: '', tags: [],
};

/** A Product as the form holds it: strings, because inputs deal in strings. */
function toDraft(product: Product | null): ProductDraft {
  if (!product) return emptyDraft;
  return {
    name: product.name,
    brandName: product.brandName,
    categoryId: product.categoryId,
    price: String(product.price / 100),
    stockQuantity: String(product.stockQuantity),
    tags: product.tags,
  };
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating; a Product = editing that one. */
  product: Product | null;
  categories: Array<{ id: string; name: string }>;
  onSubmit: (draft: ProductDraft) => void;
}

/**
 * A fully CONTROLLED form.
 *
 * Every field's `value` comes from state and every keystroke goes through
 * `onChange`. React is the single source of truth for what is on screen — you
 * can read the whole form at any moment, and you can change it from code
 * (which is exactly what "edit an existing product" needs).
 *
 * The cost is a re-render per keystroke. At six fields that is free. Session 7
 * measures where it stops being free and replaces this with React Hook Form.
 */
export function ProductFormDialog({ open, onOpenChange, product, categories, onSubmit }: ProductFormDialogProps) {
  /**
   * State initialised ONCE, from the product, when this component mounts.
   *
   * The lazy form — `useState(() => ...)` — runs the function only on the
   * first render, not on every one. For a cheap call it makes no difference;
   * the habit matters when the initial value is expensive to compute.
   *
   * The interesting part is what is NOT here: there is no `useEffect` copying
   * `product` into state when the dialog opens. That is the most common
   * "you might not need an effect" anti-pattern, and the React Hooks ESLint
   * rule rejects it outright — an effect that calls setState causes a second
   * render pass every time.
   *
   * Instead, App only renders this component while the dialog is open, so
   * every open is a fresh mount and the initial state is always right. Same
   * mechanism as Session 1's `key` lesson: React ties state to a component's
   * identity, so changing the identity resets the state.
   */
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(product));
  const [errors, setErrors] = useState<ProductDraftErrors>({});
  const isEditing = product !== null;

  /** One updater for every field, so adding a field costs nothing. */
  const setField = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    // Clear this field's error as soon as the user touches it. Leaving a red
    // message under a field somebody is actively fixing is just nagging.
    setErrors((previous) => (previous[key as keyof ProductDraftErrors] ? { ...previous, [key]: undefined } : previous));
  };

  /**
   * TODO(lab-3.2): Validate the draft and return one message per bad field.
   *
   *   name           at least 3 characters
   *   brandName      required
   *   categoryId     required
   *   price          required, a finite number, greater than 0
   *   stockQuantity  required, a whole number, 0 or more
   *
   * Collect ALL the failures rather than returning on the first one — a form
   * that reveals its problems one at a time is infuriating to fill in.
   */
  function validate(candidate: ProductDraft): ProductDraftErrors {
    const next: ProductDraftErrors = {};
    if (candidate.name.trim().length < 3) next.name = 'Name must be at least 3 characters';
    return next;
  }

  function handleSubmit(event: React.FormEvent) {
    // Do not remove this — except once, deliberately, in Lab 3.
    //
    // Without it the browser treats this as a 1998 form submission: full page
    // navigation, app reloaded from scratch, every piece of state gone
    // including the cart. The guide asks you to comment it out and watch,
    // because you want to recognise that failure the first time you cause it
    // for real.
    event.preventDefault();

    const found = validate(draft);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    onSubmit(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription>
            {isEditing ? `Updating ${product.name}.` : 'Create a new product in the catalogue.'}
          </DialogDescription>
        </DialogHeader>

        {/* A real <form>: Enter submits, and the browser gives us that free. */}
        <form onSubmit={handleSubmit} noValidate className="grid gap-4">
          <Field id="name" label="Name" error={errors.name}>
            {/* ← THIS ONE IS DONE. Copy the pattern for the other four. */}
            <Input
              id="name" value={draft.name} onChange={(e) => setField('name', e.target.value)}
              placeholder="Aurelia Vantage 14 Ultrabook"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* TODO(lab-3.1): controlled, like `name` above. Needs value,
                onChange, aria-invalid and aria-describedby. */}
            <Field id="brandName" label="Brand" error={errors.brandName}>
              <Input id="brandName" placeholder="Aurelia" />
            </Field>

            {/* TODO(lab-3.1): controlled — Select uses value + onValueChange,
                not onChange. Same idea, different prop name. */}
            <Field id="categoryId" label="Category" error={errors.categoryId}>
              <Select>
                <SelectTrigger id="categoryId" className="w-full" aria-invalid={Boolean(errors.categoryId)}>
                  <SelectValue placeholder="Choose one" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* TODO(lab-3.1): controlled */}
            <Field id="price" label="Price (₹)" error={errors.price}>
              <Input id="price" inputMode="decimal" placeholder="1299" />
            </Field>

            {/* TODO(lab-3.1): controlled */}
            <Field id="stockQuantity" label="Stock" error={errors.stockQuantity}>
              <Input id="stockQuantity" inputMode="numeric" placeholder="25" />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEditing ? 'Save changes' : 'Add product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Label + control + error, wired together.
 *
 * `htmlFor`/`id` connects the label. `aria-describedby` pointing at the error
 * means a screen reader reads the message when focus lands on the field —
 * without it, a sighted user sees the problem and everyone else does not.
 */
function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className={cn(error && 'text-destructive')}>{label}</Label>
      {children}
      {error && <p id={`${id}-error`} className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
