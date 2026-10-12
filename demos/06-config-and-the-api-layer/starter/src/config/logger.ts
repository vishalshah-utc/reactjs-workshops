import { env, type LogLevel } from './env';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = LEVELS[env.logLevel];   // env.logLevel is a LogLevel, so this index can't miss

function log(level: LogLevel, ...args: unknown[]) {
  if (LEVELS[level] < threshold) return;
  const method = level === 'debug' ? 'log' : level;
  console[method](`[${level}]`, ...args);
}

export const logger = {
  debug: (...a: unknown[]) => log('debug', ...a),
  info: (...a: unknown[]) => log('info', ...a),
  warn: (...a: unknown[]) => log('warn', ...a),
  error: (...a: unknown[]) => log('error', ...a),
};