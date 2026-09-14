import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router';
import { SiteHeader } from '../components/SiteHeader';

/**
 * The shell every page renders inside. Lab 1.2 adds ScrollRestoration;
 * Lab 2.3 gives it the wishlist and shares it with pages through Outlet context.
 */
// TODO(lab-1.2): <ScrollRestoration />
// TODO(lab-2.3): wishlist state here; export a RootOutletContext type; <Outlet context={…} />; count in the header
export function RootLayout() {
  return (
    <>
      <SiteHeader cartCount={3} />
      <Container className="py-4">
        <Outlet />
      </Container>
    </>
  );
}
