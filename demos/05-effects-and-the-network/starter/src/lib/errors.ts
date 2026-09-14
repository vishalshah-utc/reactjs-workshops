/**
 * Turns whatever was thrown into ONE sentence a user can act on.
 * Right now it just echoes the developer-facing message.
 */
// TODO(lab-3.1): map network / timeout / status codes to human sentences; prefer the backend's own message; null for cancellations
export function toMessage(err: unknown): string | null {
  return err instanceof Error ? err.message : 'Something went wrong.';
}
