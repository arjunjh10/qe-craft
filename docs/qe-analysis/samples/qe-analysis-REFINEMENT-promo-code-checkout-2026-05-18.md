# QE analysis — Promo code at checkout (sample)

- **Mode:** REFINEMENT
- **Generated:** 2026-05-18 (UTC)
- **Source:** Sample artifact for portfolio — fictional e-commerce slice

---

## 1. Understanding (max 3 bullets)

- Shoppers apply a **promo code** on the checkout review step; the cart service validates eligibility and returns adjusted totals before payment capture.
- Critical flow: enter code → validate → see line-item discount → pay; invalid or expired codes must not partially apply.
- Downstream: order service persists `promo_id` and audit fields for finance reconciliation.

## 2. Gaps & Ambiguities

- **Stacking:** Can promo combine with automatic cart-level discounts? AC silent — assume single winner unless product confirms.
- **Partial application:** Behaviour when only some line items qualify (category-restricted promos).
- **Timezone for expiry:** UTC vs store-local for `valid_until`.
- **Assumed:** Idempotent re-apply if user navigates back from payment.

## 3. Top Risks

- **Risk:** Race — code redeemed concurrently hits usage limit after UI shows success.
  - Impact: P0 | Likelihood: Medium | Detection: Hard | Mitigation: Atomic decrement at validation; surface limit-exceeded before payment.

- **Risk:** Price manipulation via client-side total override.
  - Impact: P0 | Likelihood: Low | Detection: Easy | Mitigation: Server-authoritative totals only; reject mismatched payment amount.

- **Risk:** Stale cart total cached after promo apply fails silently.
  - Impact: P1 | Likelihood: Medium | Detection: Medium | Mitigation: Invalidate cart cache on any promo mutation.

## 4. Questions to Ask

- Who owns promo catalog sync latency (marketing tool → cart service)?
- Required observability: metric for `promo_validation_failed` by reason code?
- Rollback if post-deploy bug over-discounts — disable flag vs hotfix?

## 5. Test Scenarios (High Value Only)

| # | Scenario | Exploration focus | Why it matters | Layer |
|---|----------|-------------------|----------------|-------|
| 1 | Expired code at boundary | Vary clock / `valid_until` ±1s; observe error copy and cart unchanged | Off-by-one timezone bugs | API |
| 2 | Usage limit exhaustion | Two sessions same code; watch second validation after first completes payment | Concurrency on limit counter | Integration |
| 3 | Category-restricted promo | Cart with mixed eligible / ineligible SKUs; verify per-line vs order-level discount | Partial application rules | UI |
| 4 | Back navigation from payment | Apply valid promo → pay step → browser back → change qty → re-validate | Stale totals / double apply | UI |
| 5 | Invalid code spam | Rapid invalid attempts; rate limit / logging | Abuse and noise in support | API |

## 6. Non-Functional Concerns

- **Performance:** Validation p95 under cart SLA; cache promo rules with TTL.
- **Security:** No code enumeration via distinct error messages; auth on admin promo APIs.
- **Accessibility:** Error announcements on apply failure; focus management on success.
- **Observability:** Structured logs with `promo_id`, `reason`, `cart_id` (no PII in message).

## 7. Mode-Specific Output

**REFINEMENT**

- Missing AC: stacking, partial eligibility, idempotency on navigation, finance audit fields.
- Suggested improvements: explicit state machine for cart `promo_state`; contract tests on validation response schema.

## 8. Automation Recommendations

- Contract tests for validation API (happy, expired, limit, ineligible SKU).
- UI smoke: apply + remove promo; totals match API fixture.
- Load test on validation endpoint before peak sale.

## 9. Coverage Gaps

- No automated concurrency test on usage limits.
- E2E may not cover back-navigation from payment with promo applied.

## 10. Confidence & Assumptions

- **Confidence:** Medium — based on typical checkout patterns, not a specific codebase.
- **Assumed:** Single promo per order; server-side total authority.

## 11. Repo / System Ledger

N/A — single-service refinement sample; no multi-repo scope supplied.
