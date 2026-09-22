import { useEffect, useRef } from 'react';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Counts how many times a component has rendered — and never SHOWS it.
 *
 * The count lives in a ref: a mutable box React keeps between renders and
 * does not re-render for. Put it in state and every render would schedule
 * another one. The write happens in an effect, after the commit — never
 * during render, which `react-hooks/refs` refuses: a ref read while
 * rendering makes the component impure (📖 study-notes 11 §2).
 *
 * Dev-only by construction: the logger drops `debug` in production.
 */
export function useRenderCount(label: string): void {
  const count = useRef(0);

  useEffect(() => {
    count.current += 1;
    if (env.isDev) logger.debug(`[render] ${label} #${count.current}`);
  });
}
