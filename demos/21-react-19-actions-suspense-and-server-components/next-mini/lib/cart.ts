/**
 * The cart, as a module-scope Map on the SERVER.
 *
 * This is a demo shortcut and it is important to say why: a module-scope
 * variable is shared by every visitor and dies with the process. A real app
 * keys the cart by a session cookie and stores it in a database or Redis. The
 * shape of the code around it — a Server Function that writes, a Server
 * Component that reads, `revalidatePath` between them — does not change.
 */
const lines = new Map<number, number>();

export function addLine(productId: number, quantity = 1): void {
  lines.set(productId, (lines.get(productId) ?? 0) + quantity);
}

export function quantityOf(productId: number): number {
  return lines.get(productId) ?? 0;
}

export function totalItems(): number {
  let total = 0;
  for (const quantity of lines.values()) total += quantity;
  return total;
}
