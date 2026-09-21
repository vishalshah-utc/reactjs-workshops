import { expect, test } from '@playwright/test';

/**
 * ONE journey, end to end, against the real DummyJSON API.
 *
 * This is the most expensive test in the repository — a browser, a build, a
 * server and a third-party API — so it earns its place by covering the one
 * path where a failure is a lost sale: sign in, add to cart, check out. Every
 * other behaviour in this app is cheaper to test a level down, and the 95
 * Vitest tests are where they live.
 *
 * DummyJSON SIMULATES writes: POST /carts/add returns a real, correct cart and
 * persists nothing. The journey is still real — request, response, rendering —
 * and the assertion below is written against what the API actually returns.
 */
test.describe('checkout', () => {
  test('a signed-in shopper can add a product and place an order', async ({ page }) => {
    // --- Sign in. -----------------------------------------------------------
    await page.goto('/login?redirectTo=/products');

    // getByLabel, getByRole: the same query priority as the component tests.
    // A selector like `.btn-primary` would survive the button losing its label.
    await page.getByLabel('Username').fill('emilys');
    await page.getByLabel('Password').fill('emilyspass');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // `await expect(...)` RETRIES until it passes or times out. A bare
    // `expect(await ...)` samples once and is the single biggest source of
    // flaky Playwright suites.
    await expect(page).toHaveURL(/\/products/);
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    // --- Add the first in-stock product to the cart. ------------------------
    const addToCart = page.getByRole('button', { name: 'Add to cart' }).first();
    await addToCart.click();

    // Adding opens the drawer — one store action, asserted through the UI.
    const drawer = page.getByRole('dialog', { name: /Your cart/i });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole('button', { name: 'Increase quantity' })).toHaveCount(1);

    // --- Change the quantity, then check out. -------------------------------
    await drawer.getByRole('button', { name: 'Increase quantity' }).click();
    await drawer.getByRole('button', { name: 'Checkout' }).click();

    // The fetcher posted to /account/checkout, the action called the API, and
    // the drawer reported the cart the server created.
    await expect(drawer.getByText(/Order placed — cart #/)).toBeVisible();
    await expect(drawer.getByText(/2 items/)).toBeVisible();
  });

  test('the checkout button is not offered to a signed-out visitor', async ({ page }) => {
    await page.goto('/products');
    await page.getByRole('button', { name: 'Add to cart' }).first().click();

    const drawer = page.getByRole('dialog', { name: /Your cart/i });
    await expect(drawer.getByRole('button', { name: 'Checkout' })).toHaveCount(0);
    await expect(drawer.getByRole('link', { name: /Sign in/i })).toBeVisible();
  });
});
