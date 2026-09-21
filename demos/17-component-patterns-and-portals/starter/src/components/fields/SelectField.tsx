import type { BaseFieldProps } from './FieldShell';

// TODO(lab-3.4): the generic SelectField<T extends string> lives here — options: readonly Option<T>[], value?: NoInfer<T>,
// onChange?: (value: NoInfer<T>) => void — moved from index.tsx and re-exported from there.
export interface SelectFieldProps<T extends string> extends BaseFieldProps {
  options: readonly { value: T; label: string }[];
  value?: T;
  onChange?: (value: T) => void;
}

/** Placeholder until Lab 3 — index.tsx still exports the string-only SelectField the forms use today. */
export function SelectFieldGeneric<T extends string>(_props: SelectFieldProps<T>) {
  return null;
}
