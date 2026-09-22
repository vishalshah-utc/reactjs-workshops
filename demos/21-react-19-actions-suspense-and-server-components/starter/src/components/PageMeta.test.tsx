/**
 * Three lines that answer a question you would otherwise take on trust: does
 * document metadata hoisting actually work in THIS React, in a client-rendered
 * app, with no framework underneath it?
 */

// TODO(lab-3.3): render <PageMeta> and assert on `document.title` and on
// `document.head.querySelector('meta[name="description"]')` — inside `waitFor`, because the
// hoist happens in a commit React has not run yet when render() returns. Then `unmount()` and
// assert the description is gone: otherwise every route you visited would leave one behind.
describe('PageMeta', () => {
  it.todo('hoists the title and the description into <head>');
  it.todo('falls back to the app name, and hides a page from crawlers on request');
  it.todo('removes its tags again when the route unmounts');
});
