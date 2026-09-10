import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

/**
 * A label that is wired to its input.
 *
 * `htmlFor` on the label plus a matching `id` on the input is what makes
 * clicking the label focus the field, and what makes a screen reader announce
 * "Product name, edit text" instead of just "edit text". Radix adds the
 * click-to-focus behaviour even for controls that are not real <input>s.
 */
export function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium leading-none select-none',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
