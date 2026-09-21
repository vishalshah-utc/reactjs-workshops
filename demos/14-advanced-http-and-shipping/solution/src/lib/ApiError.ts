import axios from 'axios';

const MESSAGES: Record<number, string> = {
  400: "Some of the details weren't valid.",
  401: 'Your session has expired. Please sign in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That conflicts with something that already exists.',
  422: "Some of the details weren't valid.",
  429: 'Too many requests. Give it a moment and try again.',
};

/** What DummyJSON (and most APIs) put in an error body. Everything optional — never trust it blindly. */
interface ErrorBody {
  message?: unknown;
  errors?: Record<string, string>;
}

interface ApiErrorInit {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
  requestId?: string;
  cause?: unknown;
}

/**
 * The ONE error type the app deals with above the API layer.
 * Components, loggers and (later) route error boundaries read these fields;
 * none of them import axios.
 */
export class ApiError extends Error {
  /** 0 = the request never got a response. No real HTTP status is 0, so it's an unambiguous sentinel. */
  readonly status: number;
  /** Machine-readable: NETWORK | TIMEOUT | CLIENT | HTTP_404 … */
  readonly code: string;
  /** The raw error body, for field-level validation. */
  readonly data: unknown;
  /** Correlation id — see the logging interceptor. */
  readonly requestId?: string;

  constructor({ message, status = 0, code = 'UNKNOWN', data = null, requestId, cause }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.requestId = requestId;
    this.cause = cause; // the original error, for the stack trace
  }

  /** Worth showing a Retry button for? */
  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
  get isNetwork(): boolean {
    return this.code === 'NETWORK';
  }
  get isTimeout(): boolean {
    return this.code === 'TIMEOUT';
  }
  get isAuth(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isNotFound(): boolean {
    return this.status === 404;
  }

  /** Field-level validation errors, if the backend sends them. */
  get fieldErrors(): Record<string, string> | null {
    const body = this.data as ErrorBody | null;
    return body?.errors ?? null;
  }

  /**
   * Translate ANY thrown value into an ApiError. `unknown` in, ApiError out —
   * so a catch block can go from "I have no idea what this is" to a typed
   * value in one call.
   */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (!axios.isAxiosError<ErrorBody>(error)) {
      // A bug in our own code — don't disguise it as an HTTP failure.
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      return new ApiError({ message, code: 'CLIENT', cause: error });
    }

    const requestId = error.config?.headers?.get?.('X-Request-Id')?.toString();

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({
        message: 'The server took too long to respond. Please try again.',
        code: 'TIMEOUT',
        requestId,
        cause: error,
      });
    }

    if (!error.response) {
      return new ApiError({
        message: "Can't reach the server. Check your connection and try again.",
        code: 'NETWORK',
        requestId,
        cause: error,
      });
    }

    const { status, data } = error.response;
    // The backend's message beats ours — it knows what actually went wrong.
    const message =
      (typeof data?.message === 'string' && data.message) ||
      MESSAGES[status] ||
      (status >= 500 ? "Something broke on our end. We're looking into it." : 'Something went wrong.');

    return new ApiError({ message, status, code: `HTTP_${status}`, data, requestId, cause: error });
  }
}
