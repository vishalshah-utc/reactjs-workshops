import 'axios';

/**
 * Our interceptors stash two things on the request config that axios's types
 * don't know about. A module augmentation teaches them — the alternative is
 * a cast at every use.
 */
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    /** Set by the logging interceptor, read on the way back to report timing. */
    metadata?: { startedAt: number };
    /** Set by the refresh interceptor (Demo 11) so a request is replayed at most once. */
    _retry?: boolean;
  }
}
