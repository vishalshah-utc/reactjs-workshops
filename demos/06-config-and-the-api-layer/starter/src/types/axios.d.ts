import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    /** Set by the logging interceptor, read on the way back to report timing. */
    metadata?: { startedAt: number };
    /** Set by the refresh interceptor (Demo 11) so a request is replayed at most once. */
    _retry?: boolean;
  }
}