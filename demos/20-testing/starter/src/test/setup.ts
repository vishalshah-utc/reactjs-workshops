/**
 * The file every test run loads FIRST, once per test file.
 *
 * It exists so that four things are true in every test without any test
 * having to say so: the matchers are registered, the DOM is clean, jsdom's
 * missing browser APIs are stubbed, and the network is under our control.
 */

// TODO(lab-1.1): wire the setup file — import '@testing-library/jest-dom/vitest' for the
// matchers, stub the APIs jsdom does not implement (matchMedia, IntersectionObserver,
// ResizeObserver, Element.prototype.scrollIntoView), and run RTL's cleanup() after each
// test. Lab 4 comes back here to start and stop the MSW server.
