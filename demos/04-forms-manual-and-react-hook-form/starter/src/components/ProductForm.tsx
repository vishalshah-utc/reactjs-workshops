import { useState } from 'react';
import { Button, Col, Form, Modal, Row } from 'react-bootstrap';
import type { CategoryOption, ProductDraft } from '../types';

/** Inputs hold STRINGS. This is the form's own shape; ProductDraft is what leaves it. */
interface DraftStrings {
  title: string;
  price: string;
  category: string;
  stock: string;
  description: string;
}

type DraftErrors = Partial<Record<keyof DraftStrings, string>>;

const EMPTY: DraftStrings = { title: '', price: '', category: '', stock: '10', description: '' };

/** Pure: takes the draft, returns { field: message }. Empty object = valid. */
function validate(draft: DraftStrings): DraftErrors {
  const errors: DraftErrors = {};
  if (draft.title.trim().length < 2) errors.title = 'Give it a name of at least 2 characters.';
  if (!(Number(draft.price) > 0)) errors.price = 'Price must be more than zero.';
  if (!draft.category) errors.category = 'Pick a category.';
  if (!(Number(draft.stock) >= 0)) errors.stock = 'Stock cannot be negative.';
  return errors;
}

interface ProductFormProps {
  show: boolean;
  categories: CategoryOption[];
  onCreate: (payload: ProductDraft) => void;
  onClose: () => void;
}

// TODO(lab-2.2): rebuild on TextField / NumberField / SelectField / TextAreaField; validateProduct(); touched + submitAttempted → errorFor()
export function ProductForm({ show, categories, onCreate, onClose }: ProductFormProps) {
  // ONE object for all fields. `set(field, value)` updates a copy — never mutate.
  const [draft, setDraft] = useState<DraftStrings>(EMPTY);
  const [submitted, setSubmitted] = useState(false);

  // DERIVED: errors are computed from the draft on every render, not stored.
  const errors = validate(draft);
  const showErrors = submitted;

  function set<K extends keyof DraftStrings>(field: K, value: DraftStrings[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser's full-page form POST
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return; // keep the user's input — never clear on error

    onCreate({
      title: draft.title.trim(),
      price: Number(draft.price), // inputs give STRINGS; coerce at the boundary
      category: draft.category,
      stock: Number(draft.stock),
      description: draft.description.trim(),
    });
    setDraft(EMPTY);
    setSubmitted(false);
  }

  function handleClose() {
    setDraft(EMPTY);
    setSubmitted(false);
    onClose();
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title className="h6">Add a product</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row className="g-3">
            <Col xs={12}>
              <Form.Group controlId="pf-title">
                <Form.Label className="small fw-semibold">Title</Form.Label>
                <Form.Control
                  autoFocus
                  value={draft.title}
                  onChange={(e) => set('title', e.target.value)}
                  isInvalid={showErrors && !!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="pf-price">
                <Form.Label className="small fw-semibold">Price ($)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.price}
                  onChange={(e) => set('price', e.target.value)}
                  isInvalid={showErrors && !!errors.price}
                />
                <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col sm={6}>
              <Form.Group controlId="pf-stock">
                <Form.Label className="small fw-semibold">Stock</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={draft.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  isInvalid={showErrors && !!errors.stock}
                />
                <Form.Control.Feedback type="invalid">{errors.stock}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="pf-category">
                <Form.Label className="small fw-semibold">Category</Form.Label>
                <Form.Select
                  value={draft.category}
                  onChange={(e) => set('category', e.target.value)}
                  isInvalid={showErrors && !!errors.category}
                >
                  <option value="">Choose…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.category}</Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group controlId="pf-description">
                <Form.Label className="small fw-semibold">Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={draft.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
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
