---
name: qe-incident
description: Production defect analysis with guided coaching. Call qe_intel_bug first (no API key). Use for bugs, incidents, root cause, and missed coverage.
---

# QE Incident

**Fixed mode:** `BUG`

## Start

1. Paste defect / incident (repro, impact, logs).
2. Call **`qe_intel_bug`**. Default: `output_tier: coach`.
3. Phases A–D → root-cause hypotheses, missed coverage, regression after fix.
4. **`qe_intel_review`** on draft.
5. Formal report optional → [artifact-run.md](../shared/artifact-run.md).

Runbook: [intel-run.md](../shared/intel-run.md)

## Input template

```
FEATURE / TICKET:
<bug report, repro, stack trace>

OPTIONAL: API, SYSTEM, RISKS, EXISTING COVERAGE, RELATED_REPOS
```
