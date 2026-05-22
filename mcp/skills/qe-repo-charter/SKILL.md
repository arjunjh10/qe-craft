---
name: qe-repo-charter
description: Repository-first test charter without a Jira ticket. Call qe_intel_repo_uat first (no API key). Use when exploring the repo for UAT scope and scenarios.
---

# QE Repo Charter

**Fixed mode:** `REPO_UAT`

## Start

1. Collect **FEATURE / AREA** + **REPO HINTS** (paths, E2E repo name if separate).
2. Call **`qe_intel_repo_uat`**. Default: `output_tier: coach`.
3. Execute Phases A–D using **Where to look** from the tool; cite real paths or `Assumed:`.
4. **`qe_intel_review`** optional.
5. Save on request → [artifact-run.md](../shared/artifact-run.md).

Runbook: [intel-run.md](../shared/intel-run.md)

## Input template

```
FEATURE / AREA:
<plain language scope>

REPO HINTS:
- paths / packages / URLs / branch

RELATED_REPOS (optional)
OPTIONAL: RELEASE, RISKS, COVERAGE
```
