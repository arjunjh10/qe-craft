# QE analysis — Checkout promo flow UAT (sample)

- **Mode:** UAT
- **Generated:** 2026-05-18 (UTC)
- **Source:** Sample artifact for portfolio — fictional release slice

---

## 1. Understanding (max 3 bullets)

- **Release slice:** Promo code application on checkout review, behind feature flag `checkout.promo_v2`.
- Users validate codes, see adjusted totals, and complete payment; finance receives `promo_id` on the order record.
- **Existing coverage:** API contract tests for validation; one Playwright path for happy apply; manual regression on payment providers quarterly.

## 2. Gaps & Ambiguities

- Flag default in production vs staging not confirmed for UAT window.
- Rollback plan if over-discount bug: flag off only, or also purge in-flight carts?

## 3. Top Risks

- **Risk:** Payment amount ≠ server total after promo apply.
  - Impact: P0 | Likelihood: Low | Detection: Easy | Mitigation: Block pay button until server confirms total hash.

- **Risk:** Feature flag partial rollout leaves CDN-cached checkout JS on old bundle.
  - Impact: P1 | Likelihood: Medium | Detection: Hard | Mitigation: Versioned asset URL; verify cache headers in UAT.

## 4. Questions to Ask

- GO criteria: all P0 scenarios green in staging + one prod smoke with flag at 1%?
- Who signs finance reconciliation spot-check?

## 5. Test Scenarios (High Value Only)

| # | Scenario | Exploration focus | Why it matters | Layer |
|---|----------|-------------------|----------------|-------|
| 1 | Flag off | Load checkout with flag disabled; confirm legacy path unchanged | Safe rollback surface | UI |
| 2 | Flag on — happy path | Valid code, pay with test card; compare order `promo_id` in admin | End-to-end release proof | UI |
| 3 | Flag on — invalid code | Observe error UX and cart total unchanged | Regression on silent failure | UI |
| 4 | Staging → prod config drift | Compare validation API base URL and promo rule version | Environment parity | Integration |

## 6. Non-Functional Concerns

- **Observability:** Dashboard for `promo_validation_failed` rate during UAT week.
- **Performance:** Validation p95 within 200ms under UAT load script.

## 7. Mode-Specific Output

**UAT**

- **Execution plan:** (1) Flag-off sanity, (2) API contract suite in staging, (3) exploratory rows 2–4 timeboxed, (4) prod smoke at 1%.
- **Release risks:** CDN cache, concurrent usage limits, payment total mismatch.
- **GO / NO-GO:** **CONDITIONAL GO** — proceed if P0 row 2 passes in staging and observability dashboard is wired; defer prod % rollout until finance spot-check signed.

## 8. Automation Recommendations

- Add Playwright: invalid code + back-navigation cases before prod smoke.
- Nightly contract suite against staging promo rules export.

## 9. Coverage Gaps

- Exploration rows 3–4 not in CI today.
- No automated flag-off regression in pipeline.

## 10. Confidence & Assumptions

- **Confidence:** Medium — sample narrative; real UAT would cite ticket + branch.
- **Assumed:** Staging mirrors prod promo catalog within 15 minutes.

## 11. Repo / System Ledger

N/A — UAT sample without multi-repo map.
