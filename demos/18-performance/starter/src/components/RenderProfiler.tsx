import type { ReactNode } from 'react';

interface RenderProfilerProps {
  /** Shows up in every log line and in the React DevTools Profiler's own tree. */
  id: string;
  children: ReactNode;
}

/**
 * `<Profiler>` in development, nothing at all in production.
 */
// TODO(lab-1.3): wrap `children` in React's `<Profiler id onRender>`, and log each COMMIT
// through `logger.debug` (src/config/logger.ts): id, phase, actualDuration, baseDuration.
// Guard with `import.meta.env.DEV` — the raw constant, not `env.isDev`, so the bundler can
// delete the whole branch — and return `children` untouched in production.
export function RenderProfiler({ children }: RenderProfilerProps) {
  return children;
}
