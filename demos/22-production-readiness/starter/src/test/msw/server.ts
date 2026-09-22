import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * ONE server for the whole test run, started in `src/test/setup.ts`.
 *
 * `setupServer` patches Node's HTTP layer, so it intercepts whatever the code
 * under test actually uses — axios here, `fetch` in the router, `EventSource`
 * nowhere. Nothing in `src/` is mocked, nothing is injected, and the
 * interceptors, the `ApiError` normaliser and the retry policy all run for
 * real. That is the difference between mocking the network and mocking your
 * own code.
 *
 * `server.use(...)` inside a test overrides a handler for that test only;
 * `server.resetHandlers()` in `afterEach` undoes it.
 */
export const server = setupServer(...handlers);
