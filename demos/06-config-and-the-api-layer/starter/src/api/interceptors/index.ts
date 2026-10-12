import { api } from '../client';
import { installLoggingInterceptor } from './logging';
import { installErrorNormalizer } from './errorNormalizer';

export function installInterceptors() {
  installLoggingInterceptor(api);   // 1. sees the raw error
  installErrorNormalizer(api);      // 2. LAST — converts to ApiError
}