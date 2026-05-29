---
name: qe-refinement
description: Story and backlog QE refinement with guided copilot coaching. Call qe_intel_refinement first (no API key). Use when grooming tickets, refining AC, or pre-sprint testability review.
---

# QE Refinement

**Fixed mode:** `REFINEMENT`

## Start

1. Collect input (template below).
2. Call **`qe_intel_refinement`** with `feature` + optional context. Default: `output_tier: coach`, `save_file: false`.
3. Execute **Phases A–D** from the tool response in this thread (explore repo, scenarios, AC gaps).
4. Optional: **`qe_intel_review`** on your draft scenarios.
5. Save only if user asks → [artifact-run.md](../shared/artifact-run.md).

Runbook: [intel-run.md](../shared/intel-run.md)

## Input template

```
FEATURE / TICKET:
<paste story / AC>

API / SYSTEM / USER / RISKS / EXISTING COVERAGE (optional)
RELATED_REPOS (optional)
```

## Not for

Release GO/NO-GO (`qe-uat-gate`), incidents, or writing test code (`qe-automate`).
