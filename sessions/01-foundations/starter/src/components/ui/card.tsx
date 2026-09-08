import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A COMPOUND component: `Card` plus a family of parts that are designed to be
 * used together but composed freely.
 *
 *   <Card>
 *     <CardHeader><CardTitle>…</CardTitle></CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter>…</CardFooter>
 *   </Card>
 *
 * Compare that to a single `<Card title="…" body="…" footer="…" />`. The
 * compound version lets you skip the footer, put two things in the header, or
 * wrap the content in your own div — without the Card component needing to
 * anticipate any of it. That is composition over configuration, and Session 9
 * builds a much bigger one of these from scratch.
 */
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn('bg-card text-card-foreground flex flex-col rounded-xl border shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-title" className={cn('font-semibold leading-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-description" className={cn('text-muted-foreground text-sm', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-5 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-footer" className={cn('flex items-center p-5 pt-0', className)} {...props} />;
}
