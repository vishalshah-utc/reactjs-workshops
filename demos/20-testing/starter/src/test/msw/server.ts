import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// TODO(lab-4.2): export ONE setupServer for the whole run, started and stopped in
// src/test/setup.ts. It patches Node's HTTP layer, so it intercepts whatever the code
// under test actually uses — nothing in src/ is mocked, injected or replaced.
export const server = setupServer(...handlers);
