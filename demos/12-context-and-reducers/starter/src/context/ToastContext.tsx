import type { ReactNode } from 'react';

/**
 * One toast system for the whole app: a reducer for the list, TWO contexts
 * (state and dispatch), a provider that renders the ToastContainer, and two
 * hooks. Every success or failure message in the app reports through here.
 */
// TODO(lab-3.1): toastsReducer + pushToast(message, variant) action creator; ToastStateContext and ToastDispatchContext; ToastProvider rendering a react-bootstrap <ToastContainer>; useToasts() and useToastDispatch()
export function ToastProvider({ children }: { children: ReactNode }) {
  return children;
}
