import { Form } from 'react-bootstrap';
import { FieldShell, type BaseFieldProps } from './FieldShell';

/** Attributes that pass straight through to the DOM control when the field is used UNCONTROLLED (name, defaultValue…). */
type ControlRest = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue' | 'autoFocus' | 'required' | 'readOnly'>;

// TODO(lab-3.1): export interface TextFieldHandle { focus(); select() }; accept `ref?: Ref<TextFieldHandle>` as a PROP (React 19 — no forwardRef); a private inputRef on Form.Control; useImperativeHandle(ref, () => ({ focus, select }), [])
export interface TextFieldProps extends BaseFieldProps, ControlRest {
  /** Leave `value`/`onChange` off and the field is uncontrolled — the router's <Form> wants that (Demo 10). */
  value?: string;
  /** A VALUE, not an event. Callers write `onChange={setTitle}` and never learn this is an <input>. */
  onChange?: (value: string) => void;
  onBlur?: () => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  placeholder?: string;
  autoComplete?: string;
}

/**
 * A text-like input that owns NO state.
 *
 * - `error` is DISPLAYED here, never decided here. Who decides (a hand-written
 *   validator, react-hook-form, zod) can change without touching this file.
 */
export function TextField({
  controlId,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
  ...rest
}: TextFieldProps) {
  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        isInvalid={Boolean(error)}
        {...(value !== undefined ? { value } : {})}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        onBlur={onBlur}
        {...rest}
      />
    </FieldShell>
  );
}
