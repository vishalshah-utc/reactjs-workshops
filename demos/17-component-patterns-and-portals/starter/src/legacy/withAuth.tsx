import { Component, type ComponentType } from 'react';
import { AUTH_CHANGED, tokenStore } from '../lib/tokenStore';
import type { Role, User } from '../types';

/** The props the HOC INJECTS. The wrapped component declares them; the outside world never passes them. */
export interface InjectedAuthProps {
  user: User;
}

interface WithAuthOptions {
  /** Render only for this role. Absent → any signed-in user. */
  role?: Role;
}

interface WithAuthState {
  user: User | null;
}

// TODO(lab-6.3): once nothing imports this, add a `@deprecated` JSDoc banner pointing at useAuthUser — the file STAYS (Demo 23 reads legacy code too)
/**
 * A HIGHER-ORDER COMPONENT: a function that takes a component and returns a new one with extra behaviour — here,
 * "know who is signed in, and render nothing for the wrong role". The 2018 way to share stateful logic. Used by
 * EditProductLink.
 */
export function withAuth<P extends InjectedAuthProps>(Wrapped: ComponentType<P>, { role }: WithAuthOptions = {}) {
  // The public props are the wrapped component's props MINUS what we inject. The tell of every HOC: arithmetic on prop types.
  type OuterProps = Omit<P, keyof InjectedAuthProps>;

  return class WithAuth extends Component<OuterProps, WithAuthState> {
    // What React DevTools shows — without it, every wrapped component is called "WithAuth".
    static displayName = `withAuth(${Wrapped.displayName ?? Wrapped.name ?? 'Component'})`;

    state: WithAuthState = { user: tokenStore.getUser() };

    handleAuthChange = () => this.setState({ user: tokenStore.getUser() });

    componentDidMount() {
      window.addEventListener(AUTH_CHANGED, this.handleAuthChange);
    }

    componentWillUnmount() {
      window.removeEventListener(AUTH_CHANGED, this.handleAuthChange);
    }

    render() {
      const { user } = this.state;
      if (!user || (role && user.role !== role)) return null;
      // `this.props` is OuterProps; Wrapped wants P. TypeScript cannot prove OuterProps + {user} = P for an
      // arbitrary P, so the HOC casts. Every typed HOC has this line; a hook has none.
      return <Wrapped {...(this.props as P)} user={user} />;
    }
  };
}
