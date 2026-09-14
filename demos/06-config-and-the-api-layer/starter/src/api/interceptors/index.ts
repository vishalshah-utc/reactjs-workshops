import { api } from '../client';
import { installLoggingInterceptor } from './logging';
import { installErrorNormalizer } from './errorNormalizer';

/** Called once from main.tsx. ORDER MATTERS — Lab 4.4 explains why the normaliser is last. */
// TODO(lab-4.4): install logging first, the normaliser LAST; then call this from main.tsx
export function installInterceptors() {
  void api;
  void installLoggingInterceptor;
  void installErrorNormalizer;
}
