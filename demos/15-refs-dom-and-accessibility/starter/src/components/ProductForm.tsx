import { Button, Col, Modal, Row, Spinner } from 'react-bootstrap';
import { Form as RouterForm } from 'react-router'; // same name as Bootstrap's <Form> — alias it
import { NumberField, SelectField, TextAreaField, TextField } from './fields';
import type { CategoryOption, Product, ProductDraft } from '../types';

/** What the route action returns when a submit is rejected: which fields, and what the user had typed. */
export interface ProductFormActionData {
  errors?: Partial<Record<keyof ProductDraft | 'form', string>>;
  values?: Partial<Record<keyof ProductDraft, string>>;
}

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
 * repopulate from `values` — the user's input survives.
 */
export function ProductForm({ show, editing = null, categories, action, actionData, submitting, onClose }: ProductFormProps) {
  const errors = actionData?.errors ?? {};
  const values = actionData?.values ?? {};
  /** A failed submit's value beats the product being edited beats the fallback. */
  const initial = (field: keyof ProductDraft, fallback: string | number = ''): string | number =>
    values[field] ?? editing?.[field] ?? fallback;
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  // TODO(lab-2.3): a Map of field wrapper nodes filled by ref callbacks (React 19 cleanup); after a failed submit focus the FIRST invalid field in screen order — an effect that depends on actionData
  // TODO(lab-3.2): const titleRef = useRef<TextFieldHandle>(null); ref={titleRef} on the Title field, drop autoFocus, titleRef.current?.select() in Modal's onEntered

  return (
    <Modal show={show} onHide={onClose} centered backdrop={submitting ? 'static' : true}>
      <RouterForm method="post" action={action} replace>
        <input type="hidden" name="intent" value={editing ? 'update' : 'create'} />
        {editing && <input type="hidden" name="id" value={editing.id} />}

        <Modal.Header closeButton={!submitting}>
          <Modal.Title className="h6">{editing ? `Edit “${editing.title}”` : 'Add a product'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <TextField controlId="pf-title" label="Title" name="title" autoFocus defaultValue={initial('title')} error={errors.title} disabled={submitting} />

          <Row>
            <Col sm={6}>
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
            </Col>
            <Col sm={6}>
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
            </Col>
          </Row>

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

          <TextAreaField
            controlId="pf-description"
            label="Description"
            name="description"
            rows={2}
            defaultValue={initial('description')}
            disabled={submitting}
          />

          {errors.form && <div className="alert alert-danger mt-3 mb-0">{errors.form}</div>}
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
