import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiErrorInfo } from '../lib/errorInfo';
import type { ThunkExtra } from './extra';
import type { AppDispatch, RootState } from './index';

/**
 * `createAsyncThunk`, pre-typed once for this app.
 *
 * Without this every thunk repeats a four-line generic argument to get a typed
 * `getState`, a typed `extra` and a typed `rejectWithValue` — and the first one
 * somebody forgets silently degrades to `unknown`. `withTypes` fixes the
 * ThunkApiConfig in one place; the thunks below only declare their own
 * Returned and ThunkArg types.
 *
 * The `import type { RootState } from './index'` is a CYCLE on paper —
 * index.ts imports the slices, the slices import this. It is not a cycle at
 * runtime: `verbatimModuleSyntax` erases a type-only import completely, so the
 * emitted JavaScript imports nothing from './index' at all.
 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  extra: ThunkExtra;
  /** Every rejection in this app carries the same normalised, serialisable shape. */
  rejectValue: ApiErrorInfo;
}>();
