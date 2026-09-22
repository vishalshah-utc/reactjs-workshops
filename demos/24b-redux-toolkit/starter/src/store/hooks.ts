import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './index';

/**
 * TODO(lab-1.3): the typed hooks.
 *
 * Replace the three lines below with the `withTypes` form. Import THESE
 * everywhere — never `useSelector` / `useDispatch` from react-redux directly:
 *  - plain `useSelector` types its state as `unknown`, so every selector needs
 *    an annotation and a typo compiles;
 *  - plain `useDispatch` returns a `Dispatch` that does not accept a thunk.
 */
export const useAppDispatch = useDispatch;
export const useAppSelector = useSelector;
export const useAppStore = useStore;

export type { AppDispatch, AppStore, RootState };
