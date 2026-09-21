/**
 * The single source of truth for environment configuration.
 *
 * Read `import.meta.env` NOWHERE else. This module validates on import, so a
 * misconfigured deploy fails at startup with a clear message instead of at
 * 2am with `baseURL: undefined`.
 *
 * The keys are typed in vite-env.d.ts — a typo in a name is a compile error
 * here, not a silent `undefined` in production.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

type EnvKey = keyof ImportMetaEnv & `VITE_${string}`;

function required(name: EnvKey): string {
  const value = import.meta.env[name];
  if (value === undefined || value === '') {
    throw new Error(`[config] Missing required env var ${name}. Add it to .env.${import.meta.env.MODE}.`);
  }
  return value;
}

function optional(name: EnvKey, fallback: string): string {
  const value = import.meta.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function asNumber(name: EnvKey, fallback: number): number {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) throw new Error(`[config] ${name} must be a number, got "${raw}".`);
  return parsed;
}

/** Env vars are ALWAYS strings. The string "false" is truthy. This is the classic bug. */
function asBoolean(name: EnvKey, fallback: boolean): boolean {
  const raw = import.meta.env[name];
  if (raw === undefined || raw === '') return fallback;
  return raw === 'true' || raw === '1';
}

function asLogLevel(name: EnvKey, fallback: LogLevel): LogLevel {
  const raw = optional(name, fallback);
  if (!(LOG_LEVELS as readonly string[]).includes(raw)) {
    throw new Error(`[config] ${name} must be one of ${LOG_LEVELS.join(' | ')}, got "${raw}".`);
  }
  return raw as LogLevel;
}

export const env = Object.freeze({
  appName: optional('VITE_APP_NAME', 'ShopScope'),
  mode: import.meta.env.MODE, // 'development' | 'staging' | 'production'
  isDev: import.meta.env.DEV, // true under `vite dev`, any mode
  isProd: import.meta.env.PROD, // true under any `vite build`

  api: Object.freeze({
    baseUrl: required('VITE_API_BASE_URL').replace(/\/$/, ''), // never a trailing slash
    timeoutMs: asNumber('VITE_API_TIMEOUT_MS', 10_000),
  }),


  logLevel: asLogLevel('VITE_LOG_LEVEL', 'warn'),
  pageSize: asNumber('VITE_PAGE_SIZE', 12),

  features: Object.freeze({
    uploads: asBoolean('VITE_FEATURE_UPLOADS', false),
  }),
});

/** The config's shape, for anything that wants to accept it as a parameter. */
export type Env = typeof env;

if (env.isDev) {
  console.info(`[config] ${env.appName} · mode=${env.mode} · api=${env.api.baseUrl}`);
}
