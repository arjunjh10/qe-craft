# Playwright (E2E / API)

Apply [../SKILL.md](../SKILL.md) — this file is Playwright Test conventions only.

## What to use Playwright for

- **Browser E2E** — critical user journeys across real pages (login, checkout, admin flows).
- **API tests** — `request` fixture when you need HTTP without a browser; same AAA and anti-sycophancy rules.

Do not use Playwright for unit tests of pure functions — use Jest/Vitest instead.

## Browser E2E structure

```ts
import { test, expect } from '@playwright/test';

test('checkout — shows validation error when promo code is empty', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Apply promo' }).click();
  await expect(page.getByRole('alert')).toHaveText('Promo code is required');
});
```

- **One user intent per test** — separate tests for empty promo, invalid promo, and happy apply.
- Prefer **locators** in this order: `getByRole` → `getByLabel` → `getByTestId` → `getByText` (exact text only when stable).
- Never `page.waitForTimeout(5000)` — use `expect(locator).toBeVisible()` or `waitForResponse` with a named route.

## Assertions

| ❌ Weak | ✅ Strong |
|---|---|
| `expect(await page.title()).toBeTruthy()` | `expect(page).toHaveTitle('Checkout — Acme')` |
| `expect(count).toBeGreaterThan(0)` | `await expect(page.getByRole('row')).toHaveCount(3)` |
| Screenshot-only pass with no reviewed baseline | Assert visible text/role/state; use screenshots only for layout regressions you will review |

- **Anti-sycophancy:** Expected copy and totals come from the product spec or fixture data, not from whatever the page showed on the first green run.
- Assert **URL**, **visible text**, and **ARIA state** (`toBeChecked`, `toBeDisabled`) — not DOM class names unless no accessible alternative exists.

## API tests (`request`)

```ts
test('GET /api/orders returns 401 when Authorization header is missing', async ({ request }) => {
  const res = await request.get('/api/orders');
  expect(res.status()).toBe(401);
  expect(await res.json()).toEqual({ error: 'unauthorized' });
});
```

- Seed data in `beforeEach` or a test DB; use known ids in arrange and assert.
- Prefer `baseURL` in config over hard-coded hosts.

## Fixtures and isolation

```ts
test('admin can revoke user session', async ({ page, context }) => {
  await context.addCookies([{ name: 'session', value: KNOWN_ADMIN_SESSION, domain: 'localhost', path: '/' }]);
  // ...
});
```

- Use `test.describe` for role-based suites; authenticate once per worker with `storageState` when login is expensive — not shared mutable globals across unrelated tests.
- Run tests in parallel only when each test creates its own data (unique email suffix, isolated tenant).

## Mocking network

```ts
await page.route('**/api/promo/validate', async (route) => {
  await route.fulfill({ status: 200, body: JSON.stringify({ valid: false, reason: 'expired' }) });
});
```

- Stub **external** services and slow third parties; do not stub the primary UI→API contract you are trying to validate unless testing an error path explicitly.
- Assert the UI shows the **stubbed** outcome (`Promo expired`), not just that a request happened.

## Page objects (optional)

Use thin page objects for repeated flows — they expose **user-facing actions**, not selectors leaked into every test:

```ts
// checkout.page.ts
export class CheckoutPage {
  constructor(private page: Page) {}
  async applyPromo(code: string) {
    await this.page.getByLabel('Promo code').fill(code);
    await this.page.getByRole('button', { name: 'Apply' }).click();
  }
}
```

## Common anti-patterns

| Anti-pattern | Fix |
|---|---|
| `test.only` left in CI | Remove before commit |
| Flaky `nth(3)` without stable list contract | Seed data so order is deterministic |
| Asserting `innerHTML` length | Assert user-visible outcome |
| Recording trace on every test locally without reading failures | Use trace/video on retry (`trace: 'on-first-retry'`) |
