---
name: qe-regression-impact
description: Change-impact and retest scope with guided coaching. Call qe_intel_regression first (no API key). Use for PR/release blast radius and what to retest.
---

# QE Regression Impact

**Fixed mode:** `REGRESSION`

## Start

1. Paste PR / release notes / changed areas.
2. Call **`qe_intel_regression`**. Default: `output_tier: coach`.
3. Phases A–D → impacted areas, priority retest, automation to run.
4. **`qe_intel_review`** optional.
5. Save on request → [artifact-run.md](../shared/artifact-run.md).

Runbook: [intel-run.md](../shared/intel-run.md)

## Input template

```
FEATURE / TICKET:
<PR description or change list>

RELATED_REPOS (recommended)
OPTIONAL: RISKS, EXISTING COVERAGE, changed paths
```
