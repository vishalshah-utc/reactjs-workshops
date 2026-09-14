import type { ReactElement } from 'react';

interface FieldRenderProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  error?: string;
}

/**
 * Inert for now: renders its children with empty props. Lab 3.1 turns it into
 * the (generic, typed) Controller bridge between react-hook-form and our fields.
 */
// TODO(lab-3.1): <Controller name control rules render={({ field, fieldState }) => children({ value, onChange, onBlur, error })} /> — generic over TValues / TName
export function Field({ children }: { children: (field: FieldRenderProps) => ReactElement }) {
  return children({ value: '', onChange: () => {}, onBlur: () => {}, error: undefined });
}
