# Jest / Vitest

Apply [../SKILL.md](../SKILL.md) — this file is syntax and project conventions only.

## Structure

```ts
describe('calculateDiscount', () => {
  it('returns 0 when cart total is below minimum threshold', () => {
    expect(calculateDiscount({ totalCents: 500, minCents: 1000 })).toBe(0);
  });
});
```

- Prefer `it` / `test` with behaviour names, not `test1`.
- Use `beforeEach` to reset mocks and shared fixtures; avoid order-dependent suites.

## Assertions

- `toEqual` for objects/arrays; `toBe` for primitives and referential identity.
- Async: `await expect(promise).resolves.toBe(42)` or `rejects.toThrow(DuplicateEmailError)`.
- Errors: `expect(() => fn()).toThrow(/message/)` — never swallow with try/catch.

## Mocks

```ts
vi.mock('./db', () => ({ findUser: vi.fn() }));
// or jest.mock — mock the module boundary, not the function under test
```

- `vi.useFakeTimers()` only when testing timer behaviour; always `vi.useRealTimers()` in `afterEach`.
- Prefer `vi.spyOn(dep, 'method')` over replacing the unit under test.

## Vitest vs Jest

- Vitest: `vi` instead of `jest`, `import { describe, it, expect, vi } from 'vitest'`.
- Same AAA and anti-sycophancy rules apply.
