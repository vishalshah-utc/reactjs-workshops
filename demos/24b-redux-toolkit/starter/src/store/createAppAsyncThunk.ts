import { createAsyncThunk } from '@reduxjs/toolkit';
import type { ApiErrorInfo } from '../lib/errorInfo';
import type { ThunkExtra } from './extra';
import type { AppDispatch, RootState } from './index';

/**
 * TODO(lab-2.1): `createAsyncThunk`, pre-typed once for this app.
 *
 * Add the ThunkApiConfig below — `state`, `dispatch`, `extra` and
 * `rejectValue` — so no thunk has to repeat it and none of them can silently
 * degrade to `unknown`.
 *
 * The `import type { RootState } from './index'` is a cycle on paper and not
 * one at runtime: `verbatimModuleSyntax` erases a type-only import completely.
 */
export const createAppAsyncThunk = createAsyncThunk.withTypes<{
  state: RootState;
  dispatch: AppDispatch;
  extra: ThunkExtra;
  rejectValue: ApiErrorInfo;
}>();
