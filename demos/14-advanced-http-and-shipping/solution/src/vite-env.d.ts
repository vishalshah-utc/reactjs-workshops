/// <reference types="vite/client" />

/**
 * Names and types for OUR env vars. Without this, `import.meta.env.VITE_X`
 * is `any` — and a typo in the name is a silent `undefined` at runtime.
 * Values are always strings (or missing); config/env.ts coerces them.
 */
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_LOG_LEVEL?: string;
  readonly VITE_FEATURE_UPLOADS?: string;
  readonly VITE_PAGE_SIZE?: string;
  readonly VITE_UPLOAD_BASE_URL?: string;
}
