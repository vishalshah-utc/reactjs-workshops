import { useImperativeHandle, useRef, type Ref } from 'react';
import { Form } from 'react-bootstrap';
import { FieldShell, type BaseFieldProps } from './FieldShell';

/** Attributes that pass straight through to the DOM control when the field is used UNCONTROLLED (name, defaultValue…). */
type ControlRest = Pick<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'defaultValue' | 'autoFocus' | 'required' | 'readOnly'>;

/**
 * What a parent may DO to a TextField — and nothing else. Not the <input>: hand
 * out the node and its markup becomes your public API. Two methods are a
 * contract this file can keep when the markup changes.
 */
export interface TextFieldHandle {
  focus: () => void;
  select: () => void;
}

export interface TextFieldProps extends BaseFieldProps, ControlRest {
  /** React 19: `ref` is an ordinary prop on a function component. This one receives a HANDLE, not a DOM node. */
  ref?: Ref<TextFieldHandle>;
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
 * - The <input> node stays private. `ref` exposes `focus()` and `select()` through
 *   useImperativeHandle — the narrow door, not the whole house.
 */
export function TextField({
  ref,
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
  const inputRef = useRef<HTMLInputElement>(null);

  // The handle is created once (empty deps) and reads the node lazily, so it is never stale and never null-at-mount.
  useImperativeHandle(
    ref,
    () => ({
      focus: () => inputRef.current?.focus(),
      select: () => inputRef.current?.select(), // select() also focuses — one call for "put the cursor here, ready to retype"
    }),
    [],
  );

  return (
    <FieldShell controlId={controlId} label={label} error={error} hint={hint}>
      <Form.Control
        ref={inputRef}
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
