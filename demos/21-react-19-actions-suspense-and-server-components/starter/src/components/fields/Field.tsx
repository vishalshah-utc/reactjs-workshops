import type { ReactElement } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues, type PathValue, type RegisterOptions } from 'react-hook-form';

/** Exactly the four props every field component accepts — so `{...f}` spreads straight in. */
export interface FieldRenderProps<TValue> {
  value: TValue;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  error?: string;
}

interface FieldProps<TValues extends FieldValues, TName extends FieldPath<TValues>> {
  name: TName;
  control: Control<TValues>;
  rules?: Omit<RegisterOptions<TValues, TName>, 'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'>;
  children: (field: FieldRenderProps<PathValue<TValues, TName>>) => ReactElement;
}

/**
 * The bridge between react-hook-form and OUR components.
 *
 * `register()` hands back `{ name, onChange(event), onBlur, ref }` — a DOM
 * contract. Our fields take `onChange(value)` and no ref, by design. So
 * `register` can't drive them; `Controller` can, and this wrapper turns eight
 * lines of Controller into three at every call site.
 *
 * Generic over the form's values and the field name, so `value` and `onChange`
 * are typed per field: a `number` for age, a `File | null` for avatar.
 */
export function Field<TValues extends FieldValues, TName extends FieldPath<TValues>>({
  name,
  control,
  rules,
  children,
}: FieldProps<TValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) =>
        children({
          value: field.value,
          onChange: field.onChange,
          onBlur: field.onBlur,
          error: fieldState.error?.message,
        })
      }
    />
  );
}
