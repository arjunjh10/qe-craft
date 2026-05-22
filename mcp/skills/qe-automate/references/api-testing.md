# API / HTTP testing

Apply [../SKILL.md](../SKILL.md) — this file is HTTP test conventions only.

## Scope

- Assert **status code**, **response body shape**, and **side effects** (DB row, queue message) — not "status < 400".
- Use a test database or sandbox; never hit production.

## Request/response

```ts
it('GET /api/orders returns 401 when request has no auth token', async () => {
  const res = await request(app).get('/api/orders');
  expect(res.status).toBe(401);
  expect(res.body).toEqual({ error: 'unauthorized' });
});
```

- Known fixtures: seed user `id: 7` in arrange; assert `orders[0].userId === 7` in assert.
- Auth: test missing token, expired token, and wrong role separately.

## Contract checks

- Validate required fields and types on success payloads.
- Error paths: 400 validation, 404 not found, 409 conflict — each with a specific body assertion.

## E2E discipline

- Cover critical journeys only (login → checkout, not every query-param permutation).
- Isolate tests: unique ids per run; clean up in `afterEach` or transactions.

## Tools

- Node: `supertest`, `fetch` + test server; browser E2E → [playwright.md](playwright.md) or [cypress.md](cypress.md).
- Python: `httpx` / `TestClient` (FastAPI) / `django.test.Client`.
- Apply anti-sycophancy: expected JSON comes from the API contract or product spec, not from the first response you received.
