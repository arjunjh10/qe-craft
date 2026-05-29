# Cypress (E2E)

Apply [../SKILL.md](../SKILL.md) — this file is Cypress E2E conventions only.

## What to use Cypress for

- **Browser E2E** in apps that already standardize on Cypress (component tests use `cy.mount` — see [component-testing.md](component-testing.md) for RTL/Vue; use Cypress component runner only when the project already does).

Not for unit-testing pure logic — use Jest/Vitest. Not for arbitrary scripting — every `it` must assert observable behaviour.

## Structure

```ts
describe('Checkout promo', () => {
  it('shows validation error when promo code is empty', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="promo-input"]').clear();
    cy.contains('button', 'Apply promo').click();
    cy.get('[role="alert"]').should('have.text', 'Promo code is required');
  });
});
```

- **One logical outcome per `it`** — split empty, invalid, and happy paths.
- Test titles describe failure: `shows validation error when promo code is empty`, not `promo works`.

## Queries and assertions

| ❌ Weak | ✅ Strong |
|---|---|
| `cy.get('div').should('exist')` | `cy.get('[data-testid="order-total"]').should('have.text', '$42.00')` |
| `cy.contains('Success')` (ambiguous) | `cy.contains('[role="alert"]', 'Promo applied')` |
| `cy.should(() => { expect(x).to.eq(y) })` chains without clear subject | `cy.get('@promoResponse').its('statusCode').should('eq', 200)` |
| Implicit wait on arbitrary timeout | `cy.get('[data-testid="spinner"]').should('not.exist')` |

- Prefer `data-testid` or accessible selectors (`cy.findByRole` with `@testing-library/cypress`) over CSS classes and nth-child.
- **Anti-sycophancy:** Expected amounts, labels, and error copy must match the spec — not whatever Cypress first observed.

## Network: `cy.intercept`

```ts
it('shows expired message when promo API returns expired', () => {
  cy.intercept('POST', '/api/promo/validate', {
    statusCode: 200,
    body: { valid: false, reason: 'expired' },
  }).as('validatePromo');

  cy.visit('/checkout');
  cy.get('[data-testid="promo-input"]').type('SAVE10');
  cy.contains('button', 'Apply promo').click();
  cy.wait('@validatePromo');
  cy.get('[role="alert"]').should('have.text', 'This promo has expired');
});
```

- Alias intercepts you wait on; assert **UI outcome** after `cy.wait('@alias')`.
- Stub external payment/maps APIs; avoid intercepting the main happy-path contract unless testing a failure scenario.

## Commands and isolation

```ts
// cypress/support/commands.ts — keep commands thin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin', () => {
    cy.request('POST', '/api/auth/login', { email: 'admin@test.com', password: Cypress.env('ADMIN_PASSWORD') });
  });
});
```

- **`cy.session`** for expensive login — not copy-pasted `cy.visit('/login')` in every test.
- Reset state: `beforeEach(() => { cy.visit('/'); })` or API cleanup — no shared mutable variables between tests.
- Custom commands must **return chainables** and end with an assertion in the test, not hide assertions inside the command unless the command *is* the assertion (e.g. `shouldShowError`).

## Determinism

- Do not use `cy.wait(3000)` — use built-in retrying assertions (`should('be.visible')`, `should('have.text', ...)`).
- Clock: `cy.clock()` / `cy.tick()` only when testing time-dependent UI; restore in `afterEach`.
- Unique test data: `email: \`user+${Date.now()}@test.com\`` or fixture factories.

## Component tests (Cypress)

```ts
cy.mount(<LoginForm onSubmit={cy.stub().as('submit')} />);
cy.findByLabelText(/password/i).click();
cy.findByRole('button', { name: /sign in/i }).click();
cy.findByText(/password is required/i).should('be.visible');
```

- Stub **callbacks and providers**, not the component’s own render output you are verifying.
- Assert emitted/stubbed calls: `cy.get('@submit').should('have.been.calledWith', { email: 'a@b.com' })`.

## Common anti-patterns

| Anti-pattern | Fix |
|---|---|
| Testing implementation via `.invoke('prop', 'internalState')` | Assert DOM and user-visible behaviour |
| Chaining many unrelated actions in one `it` | Split into focused tests |
| `cy.then` with manual `expect` spaghetti | Prefer `should` on subjects |
| Disabling test isolation (`testIsolation: false`) without strong reason | Keep tests independent |
