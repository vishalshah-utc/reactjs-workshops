import { cn } from '@/lib/utils';

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: React.ComponentProps<'div'> & { orientation?: 'horizontal' | 'vertical' }) {
  return (
    <div
      // A purely decorative line must be hidden from screen readers, or every
      // user of one hears "separator" between each pair of items.
      role="none"
      className={cn('bg-border shrink-0', orientation === 'horizontal' ? 'h-px w-full' : 'w-px self-stretch', className)}
      {...props}
    />
  );
}
