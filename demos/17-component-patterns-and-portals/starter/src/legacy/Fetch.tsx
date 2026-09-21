import { Component, type ReactNode } from 'react';
import { ApiError } from '../lib/ApiError';
import type { RequestStatus } from '../reducers/requestStatus';

// TODO(lab-6.3): once nothing imports this, add a `@deprecated` JSDoc banner pointing at useFetch — the file STAYS (Demo 23 reads legacy code too)
/**
 * The 2018 shape of "load data and render it": a RENDER PROP. The component owns the request lifecycle and
 * calls `render(state)` with whatever it has; the caller supplies the markup as a function. Used by RelatedProducts.
 */
interface FetchProps<T> {
  /** The request. Receives a signal so an unmount or a change of `deps` can cancel it. */
  load: (signal: AbortSignal) => Promise<T>;
  /** Re-run when any of these change — the effect dependency array, before effects existed. */
  deps: readonly unknown[];
  /** THE render prop: given the state, return the UI. The component renders nothing of its own. */
  render: (state: RequestStatus<T>) => ReactNode;
}

interface FetchState<T> {
  request: RequestStatus<T>;
}

function sameDeps(a: readonly unknown[], b: readonly unknown[]): boolean {
  return a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
}

/** A CLASS component — the only kind that could hold state and run lifecycle code before 16.8. Read the three lifecycle methods as one effect. */
export class Fetch<T> extends Component<FetchProps<T>, FetchState<T>> {
  state: FetchState<T> = { request: { status: 'idle' } };
  private controller: AbortController | null = null;

  componentDidMount() {
    this.run(); // ≈ the effect body on mount
  }

  componentDidUpdate(previous: FetchProps<T>) {
    if (!sameDeps(previous.deps, this.props.deps)) this.run(); // ≈ the effect re-running when deps change
  }

  componentWillUnmount() {
    this.controller?.abort(); // ≈ the cleanup
  }

  private async run() {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.setState({ request: { status: 'pending' } });
    try {
      const data = await this.props.load(controller.signal);
      if (!controller.signal.aborted) this.setState({ request: { status: 'success', data } });
    } catch (error) {
      if (!controller.signal.aborted) this.setState({ request: { status: 'error', error: ApiError.from(error) } });
    }
  }

  render() {
    return this.props.render(this.state.request);
  }
}
