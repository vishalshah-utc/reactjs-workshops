import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';

/**
 * The typed hooks. Write these once, in this file, and import THESE — never
 * `useSelector` and `useDispatch` from react-redux directly.
 *
 * What the plain hooks cost you:
 *  - `useSelector((state) => state.inventory.status)` — `state` is `unknown`,
 *    so every selector needs an annotation and a typo compiles;
 *  - `useDispatch()` returns the base `Dispatch`, which does not accept a
 *    thunk, so `dispatch(loadInventory(filters))` is a type error and the
 *    common workaround is a cast that hides real ones.
 *
 * `withTypes` is the RTK 2 / React Redux 9 form. You will still see the older
 * `export const useAppDispatch: () => AppDispatch = useDispatch` in most
 * codebases; it does the same thing with more punctuation.
 */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();

/** The store itself, for the rare read that must not subscribe. */
export const useAppStore = useStore.withTypes<AppStore>();
