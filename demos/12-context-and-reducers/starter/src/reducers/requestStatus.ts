/**
 * The status of one request as a STATE MACHINE: idle → pending → success | error.
 * Today ProfilePage tracks the same thing with three fields — busy, result,
 * error — which allow eight combinations, five of them impossible.
 */
// TODO(lab-1.1): RequestStatus<T> and RequestAction<T> as discriminated unions, and requestStatusReducer<T>(state, action) — pure, exhaustive, and it ignores a result that arrives after a reset
export {};
