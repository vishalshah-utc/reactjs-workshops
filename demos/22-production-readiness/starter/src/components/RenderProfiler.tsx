import { Profiler, type ProfilerOnRenderCallback, type ReactNode } from 'react';
import { logger } from '../config/logger';

interface RenderProfilerProps {
  /** Shows up in every log line and in the React DevTools Profiler's own tree. */
  id: string;
  children: ReactNode;
}

/**
 * `onRender` fires once per COMMIT of the subtree — not once per render call.
 *
 * - `phase` is 'mount' the first time, 'update' afterwards, 'nested-update' when
 *   an effect inside the subtree set state and forced a second pass.
 * - `actualDuration` is what this commit cost. It falls towards zero as
 *   children start bailing out.
 * - `baseDuration` is what it would have cost with no memoisation at all —
 *   the ceiling. `actual` close to `base` means nothing is being skipped.
 *
 * 📖 study-notes 15 §1.
 */
const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  logger.debug(`[profiler] ${id} · ${phase} · actual ${actualDuration.toFixed(1)}ms · base ${baseDuration.toFixed(1)}ms`);
};

/**
 * `<Profiler>` in development, nothing at all in production.
 *
 * `import.meta.env.DEV` — not `env.isDev` — because Vite replaces the constant
 * with `false` at build time and the bundler then removes the whole branch.
 * A property read on the frozen `env` object cannot be eliminated, and the
 * Profiler would ship. (Same rule as `WidgetBoundary`'s dev-only bomb.)
 */
export function RenderProfiler({ id, children }: RenderProfilerProps) {
  if (!import.meta.env.DEV) return children;

  return (
    <Profiler id={id} onRender={onRender}>
      {children}
    </Profiler>
  );
}
