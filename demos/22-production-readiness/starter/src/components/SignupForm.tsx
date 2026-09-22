import { useActionState } from 'react';
import { Alert, Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { CheckCircleFill } from 'react-bootstrap-icons';
import { NumberField, SelectField, TextField } from './fields';
import { SubmitButton } from './SubmitButton';
import {
  COUNTRIES,
  GENDERS,
  INTERESTS,
  SIGNUP_EMPTY,
  parseSignupFormData,
  validateSignup,
  type SignupErrors,
  type SignupValues,
} from '../lib/validation';

interface SignupFormProps {
  show: boolean;
  onClose: () => void;
}

/**
 * The form's state, as a DISCRIMINATED UNION.
 *
 * `useActionState` gives you one state slot, so model it as one value: a form
 * is idle, or it failed with errors, or it succeeded with a message. It is
 * never "succeeded AND has errors", and this type makes that unrepresentable.
 * Compare with what Demo 4 needed — `isSubmitting`, `isDirty`, `errors`,
 * `isSubmitSuccessful` — four flags whose illegal combinations you have to
 * remember not to create.
 */
type SignupState =
  | { status: 'idle' }
  | { status: 'error'; errors: SignupErrors; values: SignupValues }
  | { status: 'success'; message: string };

const IDLE: SignupState = { status: 'idle' };

/**
 * THE ACTION. A plain async function: (previous state, FormData) → next state.
 *
 * It is declared outside the component on purpose. It has no hooks, touches no
 * props and closes over nothing, which means it is testable on its own and —
 * the point of Block 4 — is the exact shape a Server Function has. Move this
 * file to Next.js, add `'use server'` at the top, and it runs on the server
 * with the same signature.
 *
 * Errors are RETURNED, not thrown. A thrown error hits the nearest error
 * boundary and takes the whole page with it; a bad email address is not that
 * kind of event. (Same rule as Demo 10's router action: expected failures are
 * return values, unexpected ones are throws.)
 */
async function signupAction(_previous: SignupState, formData: FormData): Promise<SignupState> {
  const values = parseSignupFormData(formData);

  const errors = validateSignup(values);
  if (errors) return { status: 'error', errors, values };

  await new Promise((resolve) => setTimeout(resolve, 700)); // stand-in for POST /users/add — DummyJSON has no sign-up

  if (values.email.endsWith('@taken.com')) {
    // A SERVER-side failure lands on the field it belongs to, exactly as a
    // client-side one does. From the form's point of view they are the same thing.
    return { status: 'error', errors: { email: 'That email is already registered.' }, values };
  }

  return { status: 'success', message: `${values.firstName}, your account is ready. Following: ${values.interests.join(', ')}.` };
}

/**
 * The SAME fields, driven by React 19 Actions instead of react-hook-form.
 *
 * Gone, compared with Demo 4: `useForm`, `control`, `handleSubmit`, the
 * `<Field>` render-prop wrapper, `zodResolver`, `setError`, `reset`,
 * `isSubmitting`. Gone before that, in Demo 3: `onSubmit`, `preventDefault`,
 * a `useState` per field. What is left is a `<form>` with named inputs — which
 * is what a form was before any of us started controlling it.
 *
 * What stays: the zod schema. It never cared who was calling it.
 */
export function SignupForm({ show, onClose }: SignupFormProps) {
  /**
   * Three values out of one hook:
   *   state       — whatever the action last RETURNED (the initial value until then)
   *   formAction  — the thing you hand to <form action>, not to onSubmit
   *   isPending   — true from the submit until the action's promise settles
   *
   * React also queues submissions: click "Create account" five times and the
   * action runs once. The double-submit guard everyone hand-writes is built in.
   */
  const [state, formAction, isPending] = useActionState(signupAction, IDLE);

  const errors = state.status === 'error' ? state.errors : ({} as SignupErrors);
  // After a failed submit the inputs keep what the user typed — the DOM never
  // lost it. Feeding `defaultValue` from the returned values makes that true
  // even if React resets the form, and is what a server-rendered form needs.
  const values = state.status === 'error' ? state.values : SIGNUP_EMPTY;

  function handleClose() {
    onClose();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop={isPending ? 'static' : true}>
      <Modal.Header closeButton={!isPending}>
        <Modal.Title className="h6">Create your ShopScope account</Modal.Title>
      </Modal.Header>

      {state.status === 'success' ? (
        <>
          <Modal.Body>
            {/* The success state is a RETURN VALUE, not a side effect. No toast dispatch,
                no `welcome` useState, no effect watching a flag — the action said what
                happened and the component renders it. */}
            <Alert variant="success" className="mb-0 d-flex gap-2 align-items-start">
              <CheckCircleFill className="mt-1 flex-shrink-0" aria-hidden="true" />
              <span>{state.message}</span>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleClose}>Done</Button>
          </Modal.Footer>
        </>
      ) : (
        // `action={formAction}` — a FUNCTION, not a URL. React calls it with the
        // form's FormData, keeps `isPending` true while it runs, and stores what
        // it returns. There is no onSubmit and no preventDefault anywhere below.
        <Form noValidate action={formAction}>
          <Modal.Body>
            {errors.form && (
              <Alert variant="danger" role="alert">
                {errors.form}
              </Alert>
            )}

            <Row>
              <Col sm={6}>
                {/* Uncontrolled: `name` is how the value reaches FormData, `defaultValue` is the
                    starting text. No value/onChange pair, so this field holds no React state at all. */}
                <TextField controlId="su-firstName" name="firstName" label="First name" autoComplete="given-name" defaultValue={values.firstName} error={errors.firstName} />
              </Col>
              <Col sm={6}>
                <TextField controlId="su-lastName" name="lastName" label="Last name" autoComplete="family-name" defaultValue={values.lastName} error={errors.lastName} />
              </Col>
            </Row>

            <Row>
              <Col sm={6}>
                <TextField controlId="su-email" name="email" label="Email" type="email" autoComplete="email" placeholder="try someone@taken.com" defaultValue={values.email} error={errors.email} />
              </Col>
              <Col sm={6}>
                <TextField controlId="su-password" name="password" label="Password" type="password" autoComplete="new-password" hint="At least 8 characters, including a number." error={errors.password} />
              </Col>
            </Row>

            <Row>
              <Col sm={4}>
                <NumberField controlId="su-age" name="age" label="Age" min={0} max={120} defaultValue={Number.isNaN(values.age) ? '' : values.age} error={errors.age} />
              </Col>
              <Col sm={4}>
                <Form.Group className="mb-3" controlId="su-birthDate">
                  <Form.Label className="small fw-semibold">Date of birth</Form.Label>
                  <Form.Control type="date" name="birthDate" max="2010-01-01" defaultValue={values.birthDate} isInvalid={Boolean(errors.birthDate)} />
                  <Form.Control.Feedback type="invalid">{errors.birthDate}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col sm={4}>
                <SelectField controlId="su-country" name="country" label="Country" placeholder="Choose…" options={COUNTRIES} defaultValue={values.country} error={errors.country} />
              </Col>
            </Row>

            {/* A radio GROUP is one `name` on many inputs — that is what makes them
                mutually exclusive, and it is what puts one entry in the FormData. */}
            <fieldset className="mb-3">
              <legend className="small fw-semibold">Gender</legend>
              <div className="d-flex flex-wrap gap-3">
                {GENDERS.map((option) => (
                  <Form.Check
                    key={option.value}
                    type="radio"
                    id={`su-gender.${option.value}`}
                    name="gender"
                    value={option.value}
                    defaultChecked={values.gender === option.value}
                    label={<span className="small">{option.label}</span>}
                  />
                ))}
              </div>
              {errors.gender && <div className="text-danger small mt-1">{errors.gender}</div>}
            </fieldset>

            {/* A checkbox group is MANY entries under one name. `formData.getAll('interests')`
                reads them as an array — no toggle handler, no immutable update, no state. */}
            <fieldset className="mb-3">
              <legend className="small fw-semibold">Categories to follow</legend>
              <div className="d-flex flex-wrap gap-3">
                {INTERESTS.map((option) => (
                  <Form.Check
                    key={option.value}
                    type="checkbox"
                    id={`su-interests.${option.value}`}
                    name="interests"
                    value={option.value}
                    defaultChecked={values.interests.includes(option.value)}
                    label={<span className="small">{option.label}</span>}
                  />
                ))}
              </div>
              {errors.interests ? <div className="text-danger small mt-1">{errors.interests}</div> : <Form.Text>Pick any number.</Form.Text>}
            </fieldset>

            <Form.Group className="mb-3" controlId="su-budget">
              <Form.Label className="small fw-semibold">Monthly budget</Form.Label>
              <Form.Range name="budget" min={0} max={5000} step={50} defaultValue={values.budget} />
            </Form.Group>

            <Form.Group className="mb-3" controlId="su-avatar">
              <Form.Label className="small fw-semibold">Profile picture (optional)</Form.Label>
              {/* A file input was ALWAYS uncontrolled — its value cannot be set from code.
                  FormData carries the File itself, which is why a form action can upload. */}
              <Form.Control type="file" name="avatar" accept="image/*" isInvalid={Boolean(errors.avatar)} />
              <Form.Control.Feedback type="invalid">{errors.avatar}</Form.Control.Feedback>
            </Form.Group>

            {/* An UNCHECKED box sends nothing at all. `formData.get('newsletter') === 'on'`
                is the whole read — and `null === 'on'` is false, which is the answer you want. */}
            <Form.Check type="switch" id="su-newsletter" name="newsletter" defaultChecked={values.newsletter} label={<span className="small">Email me about deals</span>} className="mb-3" />

            <Form.Check
              type="checkbox"
              id="su-terms"
              name="terms"
              defaultChecked={values.terms}
              isInvalid={Boolean(errors.terms)}
              feedback={errors.terms}
              feedbackType="invalid"
              label={<span className="small">I accept the terms and conditions</span>}
            />
          </Modal.Body>

          <Modal.Footer>
            {/* type="reset" is the browser's own: it puts every input back to its
                defaultValue. Demo 4 needed react-hook-form's reset() for this. */}
            <Button type="reset" variant="outline-secondary" disabled={isPending}>
              Reset
            </Button>
            {/* The button is a SIBLING of the fields and a CHILD of the form. It is
                passed no props about the submission and knows all about it anyway. */}
            <SubmitButton pendingLabel="Creating…">Create account</SubmitButton>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
}
