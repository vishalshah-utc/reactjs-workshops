import { useEffect, useRef } from 'react';
import { Button, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { Form as RouterForm } from 'react-router'; // same name as Bootstrap's <Form> — alias it
import { NumberField, SelectField, TextAreaField, TextField, type TextFieldHandle } from './fields';
import type { CategoryOption, Product, ProductDraft } from '../types';

/** What the route action returns when a submit is rejected: which fields, and what the user had typed. */
export interface ProductFormActionData {
  errors?: Partial<Record<keyof ProductDraft | 'form', string>>;
  values?: Partial<Record<keyof ProductDraft, string>>;
}

/** The order the fields appear on screen — "the first invalid field" means first in THIS list, not first in the errors object. */
const FIELD_ORDER: (keyof ProductDraft)[] = ['title', 'price', 'stock', 'category', 'description'];

interface ProductFormProps {
  show: boolean;
  editing?: Product | null;
  categories: CategoryOption[];
  /** Post to THIS url (path + search), so the action can redirect back to exactly this view. */
  action: string;
  actionData?: ProductFormActionData;
  submitting: boolean;
  onClose: () => void;
}

/**
 * The router's <Form>, over the SAME field components — used UNCONTROLLED.
 * Leave `value`/`onChange` off and each field passes `name` + `defaultValue`
 * straight to the DOM; the router serialises them on submit and calls the
 * route action; every loader on the page re-runs afterwards.
 *
 * On a validation failure the action RETURNS { errors, values } and the fields
 * repopulate from `values` — the user's input survives, and focus moves to the
 * first field that failed.
 */
export function ProductForm({ show, editing = null, categories, action, actionData, submitting, onClose }: ProductFormProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values ?? {};
  /** A failed submit's value beats the product being edited beats the fallback. */
  const initial = (field: keyof ProductDraft, fallback: string | number = ''): string | number =>
    values[field] ?? editing?.[field] ?? fallback;
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  // A Map of DOM nodes, one per field, filled by ref CALLBACKS. useRef can't be called in a loop; one ref
  // holding a Map can be. Never read during render — only in the effect below.
  const fieldNodes = useRef<Map<keyof ProductDraft, HTMLDivElement> | null>(null);
  const getFieldNodes = () => (fieldNodes.current ??= new Map<keyof ProductDraft, HTMLDivElement>());
  const registerField = (name: keyof ProductDraft) => (node: HTMLDivElement | null) => {
    if (!node) return;
    getFieldNodes().set(name, node);
    return () => {
      getFieldNodes().delete(name); // React 19: the cleanup runs when the node unmounts — the Map never holds a dead node
    };
  };

  // After a failed submit, focus the first invalid field. `actionData` is the dependency — a NEW object per
  // submission, the SAME object across re-renders — so this runs once per failure, not once per render.
  useEffect(() => {
    const first = FIELD_ORDER.find((name) => actionData?.errors?.[name]);
    if (!first) return;
    // A read (querySelector) and a non-destructive call (focus) — the two things a ref to React's DOM is FOR.
    getFieldNodes().get(first)?.querySelector<HTMLElement>('input, select, textarea')?.focus();
  }, [actionData]);

  // The title field's HANDLE — { focus, select }, not the <input>. Used once the modal has finished opening.
  const titleRef = useRef<TextFieldHandle>(null);

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      backdrop={submitting ? 'static' : true}
      // onEntered: the fade is done and Bootstrap's own focus management has run. Editing? The title is selected, ready to retype.
      onEntered={() => titleRef.current?.select()}
    >
      <RouterForm method="post" action={action} replace>
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="h6">{editing ? `Edit “${editing.title}”` : 'Add a product'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div ref={registerField('title')}>
            <TextField ref={titleRef} controlId="pf-title" label="Title" name="title" defaultValue={initial('title')} error={errors.title} disabled={submitting} />
          </div>

          <Row>
            <Col sm={6}>
              <div ref={registerField('price')}>
                <NumberField
                  controlId="pf-price"
                  label="Price"
                  prefix="$"
                  name="price"
                  min={0}
                  step={0.01}
                  defaultValue={initial('price')}
                  error={errors.price}
                  disabled={submitting}
                />
              </div>
            </Col>
            <Col sm={6}>
              <div ref={registerField('stock')}>
                <NumberField
                  controlId="pf-stock"
                  label="Stock"
                  name="stock"
                  min={0}
                  step={1}
                  defaultValue={initial('stock', 10)}
                  error={errors.stock}
                  disabled={submitting}
                />
              </div>
            </Col>
          </Row>

          <div ref={registerField('category')}>
            <SelectField
              controlId="pf-category"
              label="Category"
              name="category"
              placeholder="Choose…"
              options={categoryOptions}
              defaultValue={initial('category')}
              error={errors.category}
              disabled={submitting}
            />
          </div>

          <div ref={registerField('description')}>
            <TextAreaField
              controlId="pf-description"
              label="Description"
              name="description"
              rows={2}
              defaultValue={initial('description')}
              disabled={submitting}
            />
          </div>

          {errors.form && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {errors.form}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </Modal.Footer>
      </RouterForm>
    </Modal>
  );
}
