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

export class ApiError extends Error {
  readonly status: number;        // 0 = the request never got a response
  readonly code: string;          // NETWORK | TIMEOUT | CLIENT | HTTP_404 …
  readonly data: unknown;         // the raw error body, for field-level validation
  readonly requestId?: string;    // correlation id from the logging interceptor

  constructor({ message, status = 0, code = 'UNKNOWN', data = null, requestId, cause }: ApiErrorInit) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.requestId = requestId;
    this.cause = cause;           // the original error, for the stack trace
  }

  get isRetryable(): boolean {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
  get isNetwork(): boolean   { return this.code === 'NETWORK'; }
  get isTimeout(): boolean   { return this.code === 'TIMEOUT'; }
  get isAuth(): boolean      { return this.status === 401; }
  get isForbidden(): boolean { return this.status === 403; }
  get isNotFound(): boolean  { return this.status === 404; }

  /** Translate ANY thrown value into an ApiError: `unknown` in, ApiError out. */
  static from(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (!axios.isAxiosError<ErrorBody>(error)) {      // the generic types error.response.data
      // A bug in our own code — don't disguise it as an HTTP failure.
      const message = error instanceof Error ? error.message : 'Something went wrong.';
      return new ApiError({ message, code: 'CLIENT', cause: error });
    }

    const requestId = error.config?.headers?.get?.('X-Request-Id')?.toString();

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return new ApiError({ message: 'The server took too long to respond. Please try again.', code: 'TIMEOUT', requestId, cause: error });
    }

    if (!error.response) {
      return new ApiError({ message: "Can't reach the server. Check your connection and try again.", code: 'NETWORK', requestId, cause: error });
    }

    const { status, data } = error.response;
    const message =
      (typeof data?.message === 'string' && data.message) ||
      MESSAGES[status] ||
      (status >= 500 ? "Something broke on our end. We're looking into it." : 'Something went wrong.');

    return new ApiError({ message, status, code: `HTTP_${status}`, data, requestId, cause: error });
  }
}