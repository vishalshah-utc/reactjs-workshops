'use server';

import { revalidatePath } from 'next/cache';
import { addLine } from '@/lib/cart';

/**
 * A SERVER FUNCTION. `'use server'` at the top of the file marks every export
 * in it as one.
 *
 * What the directive actually does: the bundler replaces the import on the
 * client with a stub that POSTs to a generated endpoint, and wires this
 * function up to receive it. The client bundle contains the URL and the
 * argument encoder — not this code.
 *
 * Which is the whole security lesson. **A Server Function is a public HTTP
 * endpoint.** Anyone can call it with any arguments, from curl, in any order,
 * whatever the UI allows. So it validates its arguments and checks the caller
 * itself, exactly as an API route would — being "only called from one button"
 * is not a check. 📖 study-notes 19 §5
 */
export async function addToCart(productId: number): Promise<void> {
  // 1. VALIDATE. The argument arrived over the network; it is `unknown` wearing
  //    a type annotation. In a real app this is a zod parse.
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new Error('addToCart: productId must be a positive integer.');
  }

  // 2. AUTHORISE. Here: nothing to do, the cart is anonymous. In a real app:
  //    read the session cookie and refuse if it is missing or not entitled.
  //    `const session = await auth(); if (!session) throw new Error('…')`

  await new Promise((resolve) => setTimeout(resolve, 600)); // stand in for the write

  addLine(productId);

  // 3. TELL THE FRAMEWORK WHAT CHANGED. Without this the page keeps the HTML it
  //    already has and the count never moves. `revalidatePath` is the RSC
  //    equivalent of `queryClient.invalidateQueries` — same idea, different layer.
  revalidatePath('/products');
}
