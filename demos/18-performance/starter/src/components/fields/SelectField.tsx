import { Form } from 'react-bootstrap';
import { FieldShell, type BaseFieldProps, type Option } from './FieldShell';

/** Attributes that pass straight through to the DOM control when the field is used UNCONTROLLED (name, defaultValue…). */
type ControlRest = Pick<React.SelectHTMLAttributes<HTMLSelectElement>, 'name' | 'defaultValue' | 'autoFocus' | 'required'>;

/**
 * Generic over the option VALUE. `T` is inferred from `options` ONLY — pass `Option<SortKey>[]` and `value` must be
 * a SortKey and `onChange` receives one. Without `NoInfer`, TypeScript would infer T from `value` too and quietly
 * widen it to `string` to make both fit — the mismatch would compile. With it, the mismatch is caught where the
 * two meet, not in a handler at runtime.
 */
export interface SelectFieldProps<T extends string> extends BaseFieldProps, ControlRest {
  options: readonly Option<T>[];
  value?: NoInfer<T>;
  onChange?: (value: NoInfer<T>) => void;
  onBlur?: () => void;
  /** Rendered as an <option value="">, so "nothing chosen" is the empty string. */
  placeholder?: string;
}

/**
 * A GENERIC component in a .tsx file. `function SelectField<T extends string>(…)` is unambiguous here; at a call site
 * that pins T by hand — `<SelectField<SortKey> …>` — TypeScript reads the angle brackets as a type argument list
 * because they follow a component name. (Arrow-function generics are the ambiguous case: `<T,>(props) => …`,
 * where the comma tells the parser it is not a JSX tag.)
 */
export function SelectField<T extends string>({ controlId, label, value, onChange, onBlur, options, error, hint, placeholder, disabled, ...rest }: SelectFieldProps<T>) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Select
        disabled={disabled}
        isInvalid={Boolean(error)}
        {...(value !== undefined ? { value } : {})}
        // The DOM hands back a string. The <option>s were rendered FROM `options`, so it is one of T — the cast lives here, once.
        onChange={onChange ? (e) => onChange(e.target.value as T) : undefined}
        onBlur={onBlur}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </Form.Select>
    </FieldShell>
  );
}
