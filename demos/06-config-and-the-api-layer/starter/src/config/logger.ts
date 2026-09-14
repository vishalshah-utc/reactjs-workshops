/** Straight to the console. Lab 1.2 gates it on VITE_LOG_LEVEL so production stays quiet. */
// TODO(lab-1.2): level-gated logger driven by env.logLevel (a LogLevel union)
export const logger = {
  debug: (...args: unknown[]) => console.log('[debug]', ...args),
  info: (...args: unknown[]) => console.info('[info]', ...args),
  warn: (...args: unknown[]) => console.warn('[warn]', ...args),
  error: (...args: unknown[]) => console.error('[error]', ...args),
};
