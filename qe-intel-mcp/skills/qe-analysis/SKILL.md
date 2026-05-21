---
name: qe-analysis
description: Router for QE Intelligence — picks the right qe_intel_* guided run. Use when unsure which QE mode fits, or user says "QE analysis" without naming refinement/UAT/bug/regression.
---

# QE Analysis (router)

**Do not** pick MODE from a long menu. Match intent → focused skill → **`qe_intel_*`** tool.

| User intent | Skill | MCP tool |
|-------------|-------|----------|
| Groom story / AC gaps | `qe-refinement` | `qe_intel_refinement` |
| Release / GO-NO-GO | `qe-uat-gate` | `qe_intel_uat` |
| No ticket, explore repo | `qe-repo-charter` | `qe_intel_repo_uat` |
| Production bug | `qe-incident` | `qe_intel_bug` |
| PR / what to retest | `qe-regression-impact` | `qe_intel_regression` |

## Default flow

1. Load the matching focused skill (or stay here and call the tool directly).
2. **`qe_intel_<mode>`** with user input — `output_tier: coach` unless they want files/HTML.
3. Phases A–D in chat; **`qe_intel_review`** before save.
4. Phase E only on request → [artifact-run.md](../shared/artifact-run.md).

[intel-run.md](../shared/intel-run.md)

## Companion tools

- **QE Intel MCP** — guided runs + optional artifacts (no API key).
- **Playwright / Agentic QE** — test execution, not this package.

## Legacy

Avoid starting with `qe_get_system_prompt` alone — use **`qe_intel_*`** first.
