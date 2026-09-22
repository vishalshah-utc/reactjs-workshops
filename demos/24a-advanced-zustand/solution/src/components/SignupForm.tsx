import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import {
  CheckboxField,
  CheckboxGroupField,
  DateField,
  Field,
  FileField,
  NumberField,
  RadioGroupField,
  RangeField,
  SelectField,
  TextField,
} from './fields';
import { COUNTRIES, GENDERS, INTERESTS, SIGNUP_EMPTY, signupSchema, type SignupValues } from '../lib/validation';
import { pushToast, useToastDispatch } from '../context/ToastContext';

interface SignupFormProps {
  show: boolean;
  onClose: () => void;
}

/**
 * The SAME field components, driven by react-hook-form + zod.
 *
 * Gone, compared with ProductForm: the draft state, set(), touched, touch(),
 * submitAttempted, errorFor(), isValid and the guard clause. The library owns
 * the lifecycle; the schema owns the rules AND the type; the components never
 * learned either exists.
 */
export function SignupForm({ show, onClose }: SignupFormProps) {
  // Dispatch only. This component never reads the toast list, so it never re-renders for one.
  const notify = useToastDispatch();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema), // rules live in the schema, not on the fields
    mode: 'onTouched', // show a field's error once it has been visited — the same strategy as ProductForm's `touched`
    defaultValues: SIGNUP_EMPTY,
  });

  /** Called ONLY with valid data — the guard clause, built in. */
  async function onValid(values: SignupValues) {
    await new Promise((resolve) => setTimeout(resolve, 700)); // stand-in for POST /users/add — wiring it up for real is Demo 8's challenge

    if (values.email.endsWith('@taken.com')) {
      // A SERVER-side failure surfaces on the field it belongs to
      setError('email', { message: 'That email is already registered.' });
      return;
    }

    // An event handler can dispatch directly — no effect, no local `welcome` state, and the message
    // outlives the modal, which can now simply close.
    notify(pushToast(`${values.firstName}, your account is ready. Following: ${values.interests.join(', ')}.`));
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop={isSubmitting ? 'static' : true}>
      <Form noValidate onSubmit={handleSubmit(onValid)}>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title className="h6">Create your ShopScope account</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col sm={6}>
              <Field name="firstName" control={control}>
                {(f) => <TextField controlId="su-firstName" label="First name" autoComplete="given-name" {...f} />}
              </Field>
            </Col>
            <Col sm={6}>
              <Field name="lastName" control={control}>
                {(f) => <TextField controlId="su-lastName" label="Last name" autoComplete="family-name" {...f} />}
              </Field>
            </Col>
          </Row>

          <Row>
            <Col sm={6}>
              <Field name="email" control={control}>
                {(f) => (
                  <TextField
                    controlId="su-email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="try someone@taken.com"
                    {...f}
                  />
                )}
              </Field>
            </Col>
            <Col sm={6}>
              <Field name="password" control={control}>
                {(f) => (
                  <TextField
                    controlId="su-password"
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    hint="At least 8 characters, including a number."
                    {...f}
                  />
                )}
              </Field>
            </Col>
          </Row>

          <Row>
            <Col sm={4}>
              <Field name="age" control={control}>
                {(f) => <NumberField controlId="su-age" label="Age" min={0} max={120} {...f} />}
              </Field>
            </Col>
            <Col sm={4}>
              <Field name="birthDate" control={control}>
                {(f) => <DateField controlId="su-birthDate" label="Date of birth" max="2010-01-01" {...f} />}
              </Field>
            </Col>
            <Col sm={4}>
              <Field name="country" control={control}>
                {(f) => <SelectField controlId="su-country" label="Country" placeholder="Choose…" options={COUNTRIES} {...f} />}
              </Field>
            </Col>
          </Row>

          <Field name="gender" control={control}>
            {(f) => <RadioGroupField controlId="su-gender" label="Gender" options={GENDERS} {...f} />}
          </Field>

          <Field name="interests" control={control}>
            {(f) => (
              <CheckboxGroupField controlId="su-interests" label="Categories to follow" options={INTERESTS} hint="Pick any number." {...f} />
            )}
          </Field>

          <Field name="budget" control={control}>
            {(f) => (
              <RangeField controlId="su-budget" label="Monthly budget" min={0} max={5000} step={50} format={(n) => `$${n}`} {...f} />
            )}
          </Field>

          <Field name="avatar" control={control}>
            {/* FileField takes `file`, not `value` — the one component that can't use {...f} */}
            {({ value, onChange, error }) => (
              <FileField controlId="su-avatar" label="Profile picture (optional)" accept="image/*" file={value} onChange={onChange} error={error} />
            )}
          </Field>

          {/* CheckboxField takes `checked`, not `value` */}
          <Field name="newsletter" control={control}>
            {({ value, onChange }) => (
              <CheckboxField controlId="su-newsletter" type="switch" label="Email me about deals" checked={value} onChange={onChange} />
            )}
          </Field>

          <Field name="terms" control={control}>
            {({ value, onChange, error }) => (
              <CheckboxField controlId="su-terms" label="I accept the terms and conditions" checked={value} onChange={onChange} error={error} />
            )}
          </Field>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => reset()} disabled={!isDirty || isSubmitting}>
            Reset
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {isSubmitting ? 'Creating…' : 'Create account'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
