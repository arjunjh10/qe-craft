---
name: qe-automate
description: >
  Write effective, meaningful automated tests for any language or framework. Use this skill whenever the user asks to write tests, unit tests, integration tests, E2E tests, test suites, or specs — or when reviewing existing tests for quality. Trigger on phrases like "write tests for", "add test coverage", "test this function", "write a test suite", "help me test this", "improve my tests", or when the user shares code and implies it needs testing. Also trigger when tests look trivially true or don't actually assert meaningful behaviour.

  This skill enforces QE best practices: tests must be meaningful, behaviour-driven, and falsifiable. It actively prevents tautological assertions (expect(true).toBe(true)), over-mocking, and tests that cannot catch real regressions.
---

# Quality Engineering — Automated Test Writing

## Core Philosophy

**A test that cannot fail is not a test.** Every assertion must be falsifiable — if you deleted or broke the real implementation, the test must turn red.

Before writing a single line of test code, ask: *"If I introduced a bug here, would this test catch it?"* If the answer is no, the test is not worth writing.

---

## The Five Laws of Meaningful Tests

1. **Assert real behaviour, not implementation details.** Test what the code *does*, not how it does it internally.
2. **Every test must be able to fail.** Tautologies (`expect(true).toBe(true)`, `expect(x).toBeDefined()` with no follow-up) are noise.
3. **One logical concept per test.** A test that checks ten things is ten untitled bugs waiting to happen.
4. **Tests must be deterministic.** No random data, no real network calls, no real timers unless the test is explicitly about those.
5. **The test name must describe failure.** "should return correct value" is useless. "should return 0 when divisor is 0" tells you exactly what broke.

---

## Test Anatomy

Every test follows the **Arrange → Act → Assert** (AAA) structure. Never mix these phases.

```
// Arrange: set up inputs, mocks, state
// Act: call the thing under test — ONE call only
// Assert: verify the outcome — be specific
```

Avoid multiple "Act" steps in a single test. If you need to call the function twice, write two tests.

---

## What to Assert

Always prefer **specific value assertions** over presence or type checks.

| ❌ Weak | ✅ Strong |
|---|---|
| `expect(result).toBeDefined()` | `expect(result).toEqual({ id: 1, name: 'Alice' })` |
| `expect(arr.length).toBeGreaterThan(0)` | `expect(arr).toHaveLength(3)` |
| `expect(typeof val).toBe('string')` | `expect(val).toBe('hello world')` |
| `expect(fn).not.toThrow()` | `expect(result).toBe(42)` (test the output) |
| `expect(spy).toHaveBeenCalled()` | `expect(spy).toHaveBeenCalledWith({ userId: 7, role: 'admin' })` |
| `expect(res.status).toBeLessThan(400)` | `expect(res.status).toBe(200)` |

---

## Naming Conventions

Use the pattern: **`[unit] [should/returns/throws] [expected behaviour] [when/given context]`**

```
✅ calculateDiscount — returns 0 when cart total is below minimum threshold
✅ UserService.create — throws DuplicateEmailError when email already exists
✅ LoginForm — shows validation error when password field is empty
✅ /api/orders GET — returns 401 when request has no auth token

❌ test1
❌ works correctly
❌ handles edge case
❌ should return correct result
```

---

## Mocking Rules

Mock **only what crosses a boundary** (network, database, file system, time, 3rd-party services). Never mock the thing you are testing.

```js
// ❌ Wrong: mocking the unit under test
jest.spyOn(userService, 'buildUserObject').mockReturnValue(...)
// Then testing userService.buildUserObject — you're testing the mock!

// ✅ Right: mock the dependency, test the real logic
jest.spyOn(db, 'findUser').mockResolvedValue({ id: 1, email: 'a@b.com' })
const result = await userService.getUser(1)
expect(result.email).toBe('a@b.com')
```

**Verify mocks were called correctly** when the call itself is part of the contract:
```js
expect(emailSender.send).toHaveBeenCalledWith({
  to: 'user@example.com',
  subject: 'Welcome',
  templateId: 'onboarding-v2'
})
```

---

## Test Categories & When to Use Each

### Unit Tests
- One function or class in isolation
- All dependencies mocked
- Fast (< 5ms each)
- High volume — aim for full branch coverage on business logic

### Integration Tests
- Multiple real modules working together
- Mock only external I/O (HTTP, DB, filesystem)
- Test happy paths + key error paths
- Verify data flows correctly across module boundaries

### End-to-End / API Tests
- Full request/response cycle
- Use a test database or sandbox environment
- Test critical user journeys only (not every permutation)
- Validate status codes, response shapes, and side effects

---

## Edge Cases to Always Cover

For any non-trivial function, test:
- **Happy path** — typical valid input
- **Boundary values** — min, max, zero, empty string, empty array
- **Invalid / unexpected input** — null, undefined, wrong type if the language allows
- **Error / exception paths** — what happens when dependencies fail
- **Async edge cases** — rejection, timeout, concurrent calls (if applicable)

---

## Framework-Specific Guidance

Read the relevant reference file for the framework in use:

- **JavaScript / TypeScript (Jest, Vitest)** → [references/jest-vitest.md](references/jest-vitest.md)
- **Python (pytest)** → [references/pytest.md](references/pytest.md)
- **Java / Kotlin (JUnit 5, Mockito)** → [references/junit.md](references/junit.md)
- **React / Vue component testing** → [references/component-testing.md](references/component-testing.md)
- **API / HTTP testing** → [references/api-testing.md](references/api-testing.md)
- **Playwright (E2E / API)** → [references/playwright.md](references/playwright.md)
- **Cypress (E2E)** → [references/cypress.md](references/cypress.md)

If the framework is not listed, apply the general principles above and adapt syntax accordingly.

---

## Anti-Sycophancy Scoring

A **sycophantic test** agrees with whatever the implementation does, rather than challenging it. It passes on the first run and keeps passing even when the code is wrong — because it derived its expected value *from* the code instead of *knowing* it independently.

### The Core Rule

> **The expected value in an assertion must be known before the function is called.**

If you have to run the code to find out what to assert, you're not testing — you're transcribing.

### Sycophantic Patterns

```js
// ❌ Tautology — compares output to itself
expect(calculateTax(100)).toBe(calculateTax(100))

// ❌ Snapshot sycophancy — first run "learns" a wrong answer and enshrines it
const result = processOrder(input)
expect(result).toMatchSnapshot()   // if the logic is broken, the snapshot is too

// ❌ Round-trip sycophancy — encode then decode, assert equality
const encoded = encode(data)
const decoded = decode(encoded)
expect(decoded).toEqual(data)      // passes even if both functions are broken the same way

// ❌ Trusting the implementation to define correctness
const discount = applyDiscount(cart)
expect(discount).toBeGreaterThanOrEqual(0)   // true by definition if discount can't go negative
```

```js
// ✅ Expected value is independently known
expect(calculateTax(100)).toBe(10)           // you know 10% of 100 is 10

// ✅ Snapshot used correctly — only for stable, reviewed, non-logic output
expect(renderEmailTemplate(user)).toMatchSnapshot()  // HTML layout, not business logic

// ✅ Round-trip with a known fixture
expect(decode('eyJ1c2VyIjoxfQ==')).toEqual({ user: 1 })  // known input, known output
```

### The Three-Question Sycophancy Score

Before finalising any assertion, answer these three questions. Each "yes" scores 1 point.

| # | Question | What a "no" means |
|---|---|---|
| 1 | **Did I know the expected value before running the code?** | You're asserting whatever the code returned |
| 2 | **Would this assertion fail if the core logic had an off-by-one error?** | Your assertion is too loose to catch real bugs |
| 3 | **Is the expected value derived from domain knowledge, not from the implementation?** | You're testing the code against itself |

**Score 3/3** → honest test, proceed.  
**Score 2/3** → review the weak question before proceeding.  
**Score 1/3 or below** → rewrite the assertion; this test provides false confidence.

### Snapshot Discipline

Snapshots are not inherently sycophantic, but they become sycophantic when:
- Created on a first run that was never manually verified to be correct
- Updated with `--updateSnapshot` without reviewing the diff
- Used for logic outputs (computed values, transformed data) rather than stable structure (rendered markup, generated config)

**Rule:** Every snapshot must be reviewed by a human before being committed. An auto-accepted snapshot is a sycophantic test.

---

## Self-Check Before Submitting Tests

Run through this checklist mentally for every test you write:

- [ ] If I deleted the implementation, would this test fail?
- [ ] Did I know the expected value *before* running the code (anti-sycophancy score ≥ 3/3)?
- [ ] Is every assertion specific (exact value, not just presence)?
- [ ] Does the test name describe what it checks and under what condition?
- [ ] Is the AAA structure clear with no mixed phases?
- [ ] Am I only mocking things external to the unit under test?
- [ ] Is there at least one unhappy-path or edge-case test alongside the happy path?
- [ ] Would a new developer understand exactly what broke from the failure message alone?

If any answer is "no", revise before presenting to the user.

---

## Anti-Patterns to Actively Avoid

| Anti-pattern | Why it's harmful | Fix |
|---|---|---|
| `expect(true).toBe(true)` | Always passes, tests nothing | Assert actual computed value |
| `expect(result).toBeDefined()` as the only assertion | Passes even if result is completely wrong | Assert the actual value |
| Testing implementation internals (private methods, internal state) | Breaks on refactor, not on real bugs | Test public API and observable output |
| One giant test covering many scenarios | Hard to pinpoint failures | Split into focused tests |
| Magic numbers / strings with no explanation | Unreadable, unclear intent | Use named constants or inline comments |
| `try/catch` in tests to suppress errors | Hides failures | Use framework's `toThrow` / `pytest.raises` |
| Asserting mock call count without asserting arguments | Misses wrong arguments being passed | Always assert `.toHaveBeenCalledWith(...)` |
| Shared mutable state between tests | Makes tests order-dependent and flaky | Reset state in `beforeEach` / `setUp` |
| `expect(fn(x)).toBe(fn(x))` or deriving expected from the implementation | Sycophantic — always passes, even when logic is wrong | Use an independently known expected value |
| Auto-accepting snapshot updates without reviewing the diff | Enshrines broken behaviour as correct | Always manually review snapshot diffs before committing |
