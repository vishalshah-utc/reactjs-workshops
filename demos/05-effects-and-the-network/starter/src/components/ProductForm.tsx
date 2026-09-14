import { useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import { PRODUCT_EMPTY, validateProduct } from '../lib/validation';
import type { CategoryOption, ProductDraft } from '../types';

type Touched = Partial<Record<keyof ProductDraft, boolean>>;

interface ProductFormProps {
  show: boolean;
  categories: CategoryOption[];
  onCreate: (payload: ProductDraft) => void;
  onClose: () => void;
}

/**
 * The hand-rolled form. Three questions, answered separately:
 *   1. What are the rules?          → validateProduct(), a pure function
 *   2. When do we run them?         → every render (derived, never stored)
 *   3. When do we SHOW the result?  → after the field was touched, or a submit was attempted
 */
export function ProductForm({ show, categories, onCreate, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(PRODUCT_EMPTY);
  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const errors = validateProduct(draft); // derived every render — never setErrors()
  const isValid = Object.keys(errors).length === 0;

  function set<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function touch(field: keyof ProductDraft) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  /** `errors` says what is wrong; this says whether to mention it YET. */
  function errorFor(field: keyof ProductDraft): string | undefined {
    if (!errors[field]) return undefined;
    return touched[field] || submitAttempted ? errors[field] : undefined;
  }

  function reset() {
    setDraft(PRODUCT_EMPTY);
    setTouched({});
    setSubmitAttempted(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!isValid) return; // the ONE guard between the form and whatever consumes it

    onCreate({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
    reset();
  }

  function handleClose() {
    reset();
    onClose();
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Add a product</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <TextField
            controlId="pf-title"
            label="Title"
            autoFocus
            value={draft.title}
            onChange={(v) => set('title', v)}
            onBlur={() => touch('title')}
            error={errorFor('title')}
          />

          <Row>
            <Col sm={6}>
              <NumberField
                controlId="pf-price"
                label="Price"
                prefix="$"
                min={0}
                step={0.01}
                value={draft.price}
                onChange={(v) => set('price', v)}
                onBlur={() => touch('price')}
                error={errorFor('price')}
              />
            </Col>
            <Col sm={6}>
              <NumberField
                controlId="pf-stock"
                label="Stock"
                min={0}
                step={1}
                value={draft.stock}
                onChange={(v) => set('stock', v)}
                onBlur={() => touch('stock')}
                error={errorFor('stock')}
              />
            </Col>
          </Row>

          <SelectField
            controlId="pf-category"
            label="Category"
            placeholder="Choose…"
            options={categoryOptions}
            value={draft.category}
            onChange={(v) => set('category', v)}
            onBlur={() => touch('category')}
            error={errorFor('category')}
          />

          <TextAreaField
            controlId="pf-description"
            label="Description"
            rows={2}
            maxLength={300}
            value={draft.description}
            onChange={(v) => set('description', v)}
            onBlur={() => touch('description')}
            error={errorFor('description')}
            hint="Optional."
          />
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Create product</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
