import { useState } from 'react';
import { Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import { PRODUCT_EMPTY, validateProduct } from '../lib/validation';
import { ApiError } from '../lib/ApiError';
import type { CategoryOption, Product, ProductDraft } from '../types';
import { ErrorNotice } from './ErrorNotice';

type Touched = Partial<Record<keyof ProductDraft, boolean>>;

/** A product → a draft. NumberField keeps numbers as numbers, so no String() here. */
function toDraft(product: Product | null): ProductDraft {
  if (!product) return PRODUCT_EMPTY;
  return {
    title: product.title,
    price: product.price,
    category: product.category,
    stock: product.stock,
    description: product.description,
  };
}

interface ProductFormProps {
  show: boolean;
  /** null = create. A product = edit it. */
  editing?: Product | null;
  categories: CategoryOption[];
  /** Async on purpose: throw and the form shows the error and keeps the input. */
  onSubmit: (payload: ProductDraft) => Promise<void>;
  onClose: () => void;
}

/**
 * Create OR edit, decided by `editing`. The parent renders it with
 * `key={editing?.id ?? 'new'}` so switching between products remounts the
 * form with fresh initial state — no effect needed to "sync" the draft.
 */
// TODO(lab-3.1): the router's <Form method="post"> — the same fields UNCONTROLLED (name + defaultValue), errors from useActionData(), submitting from useNavigation()
export function ProductForm({ show, editing = null, categories, onSubmit, onClose }: ProductFormProps) {
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft(editing));
  const [touched, setTouched] = useState<Touched>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const errors = validateProduct(draft); // derived every render
  const isValid = Object.keys(errors).length === 0;

  function set<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }
  function touch(field: keyof ProductDraft) {
    setTouched((current) => ({ ...current, [field]: true }));
  }
  function errorFor(field: keyof ProductDraft): string | undefined {
    if (!errors[field]) return undefined;
    return touched[field] || submitAttempted ? errors[field] : undefined;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return; // guard the double-click
    setSubmitAttempted(true);
    if (!isValid) return;

    const payload: ProductDraft = { ...draft, title: draft.title.trim(), description: draft.description.trim() };

    try {
      setSaving(true);
      setError(null);
      await onSubmit(payload); // the parent talks to the server and closes us on success
      setDraft(PRODUCT_EMPTY);
      setTouched({});
      setSubmitAttempted(false);
    } catch (err) {
      setError(ApiError.from(err)); // stay open, keep the user's input — never clear a form on failure
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (saving) return;
    setError(null);
    setTouched({});
    setSubmitAttempted(false);
    onClose();
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Modal show={show} onHide={handleClose} centered backdrop={saving ? 'static' : true}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton={!saving}>
          <Modal.Title className="h6">{editing ? `Edit “${editing.title}”` : 'Add a product'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <TextField
            controlId="pf-title"
            label="Title"
            autoFocus
            disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
            disabled={saving}
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
            hint="Optional."
            disabled={saving}
            value={draft.description}
            onChange={(v) => set('description', v)}
            onBlur={() => touch('description')}
            error={errorFor('description')}
          />

          <div className="mt-3">
            <ErrorNotice error={error} title="Couldn't save" />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Spinner as="span" size="sm" animation="border" className="me-2" />}
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
