import { Card, Col, Placeholder, Row } from 'react-bootstrap';

export function CardSkeletons({ count = 8 }: { count?: number }) {
  return (
    <Row xs={1} sm={2} md={3} xl={4} className="g-3" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <Col key={i}>
          <Card className="h-100">
            <div className="bg-body-secondary" style={{ height: 160 }} />
            <Card.Body>
              <Placeholder as="div" animation="glow" className="small">
                <Placeholder xs={4} />
              </Placeholder>
              <Placeholder as={Card.Title} animation="glow" className="fs-6">
                <Placeholder xs={9} />
              </Placeholder>
              <Placeholder as="div" animation="glow">
                <Placeholder xs={3} /> <Placeholder xs={2} />
              </Placeholder>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}