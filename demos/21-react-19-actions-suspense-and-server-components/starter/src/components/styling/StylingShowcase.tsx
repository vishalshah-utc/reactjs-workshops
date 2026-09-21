import type { ReactNode } from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import type { PriceTagProps } from '../PriceTag';
import { PriceTagPlain } from './PriceTag.plain';
import { PriceTagModule } from './PriceTag.module';
import { PriceTagInline } from './PriceTag.inline';
import { PriceTagTailwind } from './PriceTag.tailwind';
import { PriceTagBootstrap } from './PriceTag.bootstrap';
import { DialogComparison } from './DialogComparison';

/** One product, so the five renderings are comparable to the pixel. */
const SAMPLE: PriceTagProps = { price: 64, discountPercentage: 25, size: 'md' };

interface Way {
  name: string;
  file: string;
  /** What to look at in DevTools → Elements for this one. */
  inspect: string;
  render: (props: PriceTagProps) => ReactNode;
}

const WAYS: Way[] = [
  {
    name: '1 · Plain CSS',
    file: 'PriceTag.plain.tsx + pricetag.css',
    inspect: 'class="price price--md" — names you typed, matched by a global stylesheet.',
    render: (props) => <PriceTagPlain {...props} />,
  },
  {
    name: '2 · CSS Modules',
    file: 'PriceTag.module.tsx + PriceTag.module.css',
    inspect: 'class="_price_…" — the same names, hashed per file. Nothing else on the page can match them.',
    render: (props) => <PriceTagModule {...props} />,
  },
  {
    name: '3 · Inline style',
    file: 'PriceTag.inline.tsx',
    inspect: 'no class at all — a style="" attribute per element. Hover it: that colour change is state, not :hover.',
    render: (props) => <PriceTagInline {...props} />,
  },
  {
    name: '4 · Tailwind',
    file: 'PriceTag.tailwind.tsx + src/tailwind.css',
    inspect: 'class="tw:flex tw:gap-2 …" — one class per declaration, generated from THIS file only.',
    render: (props) => <PriceTagTailwind {...props} />,
  },
  {
    name: '5 · Bootstrap utilities',
    file: 'PriceTag.bootstrap.tsx',
    inspect: 'class="d-flex gap-2 fw-semibold fs-5" — the framework\'s vocabulary; the app keeps this one.',
    render: (props) => <PriceTagBootstrap {...props} />,
  },
];

/** The About page's second half: the same PriceTag five ways, then a styled dialog next to a headless one. */
export function StylingShowcase() {
  return (
    <>
      <section aria-labelledby="styling-heading" className="mt-4">
        <h2 id="styling-heading" className="h5">
          One PriceTag, five ways
        </h2>
        <p className="text-muted small">Same props, same pixels. Inspect each one and compare the class attribute.</p>
        <Row xs={1} md={2} xl={3} className="g-3">
          {WAYS.map((way) => (
            <Col key={way.name}>
              <Card className="h-100">
                <Card.Body className="d-flex flex-column gap-2">
                  <div className="small text-muted text-uppercase fw-medium">{way.name}</div>
                  {way.render(SAMPLE)}
                  <code className="small">{way.file}</code>
                  <p className="small text-muted mb-0 mt-auto">{way.inspect}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </section>

      <DialogComparison />
    </>
  );
}
