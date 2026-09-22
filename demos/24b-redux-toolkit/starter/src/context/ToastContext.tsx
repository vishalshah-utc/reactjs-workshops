import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

export type ToastVariant = 'success' | 'danger' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

export type ToastAction = { type: 'push'; toast: ToastItem } | { type: 'dismiss'; id: number };

/** Never more than this many on screen: the oldest drops off. A rule, so it lives in the reducer. */
const MAX_VISIBLE = 4;

/** PURE. Given the same list and the same action it returns the same list — which is why it's trivially testable. */
export function toastsReducer(toasts: ToastItem[], action: ToastAction): ToastItem[] {
  switch (action.type) {
    case 'push':
      return [...toasts, action.toast].slice(-MAX_VISIBLE);
    case 'dismiss':
      return toasts.filter((toast) => toast.id !== action.id);
    default: {
      const unhandled: never = action;
      throw new Error(`Unhandled toast action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// "The next id" is not pure — it changes every call. So it happens HERE, before dispatch, never inside the reducer.
let nextId = 1;

/** An action creator: the one place that knows what a "push" action looks like. */
export function pushToast(message: string, variant: ToastVariant = 'success'): ToastAction {
  return { type: 'push', toast: { id: nextId++, variant, message } };
}

// TWO contexts, not one. The list changes on every push and dismiss; `dispatch` never changes.
// A component that only REPORTS subscribes to dispatch alone and never re-renders for a toast.
const ToastStateContext = createContext<ToastItem[] | undefined>(undefined);
const ToastDispatchContext = createContext<Dispatch<ToastAction> | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  // useReducer returns the state and a dispatch whose identity is STABLE for the component's life — no useCallback needed.
  const [toasts, dispatch] = useReducer(toastsReducer, []);

  return (
    <ToastStateContext value={toasts}>
      <ToastDispatchContext value={dispatch}>
        {children}
        <ToastViewport />
      </ToastDispatchContext>
    </ToastStateContext>
  );
}

const TITLES: Record<ToastVariant, string> = { success: 'Done', danger: 'Something went wrong', info: 'Heads up' };

/** The only component that reads the LIST. It is rendered once, by the provider, above every route. */
function ToastViewport() {
  const toasts = useToasts();
  const dispatch = useToastDispatch();

  return (
    <ToastContainer position="bottom-end" className="p-3" containerPosition="fixed" style={{ zIndex: 1080 }}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          bg={toast.variant}
          autohide
          delay={toast.variant === 'danger' ? 8000 : 5000}
          onClose={() => dispatch({ type: 'dismiss', id: toast.id })}
        >
          <Toast.Header>
            <strong className="me-auto">{TITLES[toast.variant]}</strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'info' ? '' : 'text-white'}>{toast.message}</Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}

export function useToasts(): ToastItem[] {
  const toasts = useContext(ToastStateContext);
  if (toasts === undefined) throw new Error('useToasts() must be called inside <ToastProvider>.');
  return toasts;
}

export function useToastDispatch(): Dispatch<ToastAction> {
  const dispatch = useContext(ToastDispatchContext);
  if (dispatch === undefined) throw new Error('useToastDispatch() must be called inside <ToastProvider>.');
  return dispatch;
}
