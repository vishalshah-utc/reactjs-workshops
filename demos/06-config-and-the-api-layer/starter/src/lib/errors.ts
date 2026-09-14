import axios from 'axios';

/**
 * Turns whatever axios threw into ONE sentence a user can act on.
 *
 * `err.message` is written for developers ("Request failed with status code
 * 400"). `err.response.data.message` is written by the backend for users
 * ("Invalid credentials"). Prefer the backend's; fall back to ours.
 */
export function toMessage(err: unknown): string | null {
  if (axios.isCancel(err)) return null; // not an error — show nothing

  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : 'Something went wrong.'; // a bug in our own code
  }

  const status = err.response?.status;
  const body = err.response?.data as { message?: unknown } | undefined;
  const fromServer = typeof body?.message === 'string' ? body.message : undefined;

  if (err.code === 'ECONNABORTED') return 'The server took too long to respond. Try again.';
  if (!err.response) return "Can't reach the server. Check your connection and try again.";

  switch (status) {
    case 400:
    case 422:
      return fromServer ?? "Some of the details weren't valid.";
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return "You don't have permission to do that.";
    case 404:
      return fromServer ?? "We couldn't find what you were looking for.";
    case 429:
      return 'Too many requests. Give it a moment and try again.';
    default:
      if (status !== undefined && status >= 500) return "Something broke on our end. We're looking into it.";
      return fromServer ?? 'Something went wrong.';
  }
}
