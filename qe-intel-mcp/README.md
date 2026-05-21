# QE Intel MCP (`qe-intel-mcp`)

**Guided QE in your copilot** — phased playbooks for people who are not full-time QEs. **No API key.** Inference stays in Cursor; MCP returns the director’s script and optional artifact save.

Pair with **seven Cursor skills** (`npx qe-intel-mcp init`): router + five mode skills + test automation.

## Requirements

- Node.js **22+**
- Cursor (stdio MCP)

## Quick setup

### 1. MCP — `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "qe-intel": {
      "command": "npx",
      "args": ["-y", "qe-intel-mcp@latest"],
      "env": {
        "REPO_ROOT": "/absolute/path/to/your/target-repo"
      }
    }
  }
}
```

### 2. Skills

```bash
npx qe-intel-mcp init
# team: npx qe-intel-mcp init --project /absolute/path/to/your-repo
npx qe-intel-mcp@latest init --force   # upgrade
```

Installs: `qe-analysis`, `qe-refinement`, `qe-uat-gate`, `qe-repo-charter`, `qe-incident`, `qe-regression-impact`, `qe-automate`.

### 3. Restart Cursor

| Variable | Purpose |
|----------|---------|
| `REPO_ROOT` | Repo for scan hints + `docs/qe-analysis/` writes |

---

## Primary MCP tools (`qe_intel_*`)

| Tool | When |
|------|------|
| `qe_intel_refinement` | Story grooming, AC gaps |
| `qe_intel_uat` | Release GO/NO-GO |
| `qe_intel_repo_uat` | No ticket — repo charter |
| `qe_intel_bug` | Incident / defect |
| `qe_intel_regression` | PR blast radius, retest |
| `qe_intel_review` | Critique draft scenarios before save |

**Default:** `output_tier: coach` — Phases A–D in chat; **no file** unless user asks.

**Optional:** `output_tier: full` + Phase E → `qe_validate_report` / `qe_save_report` / `qe_save_markdown`.

---

## Example (UAT — coach)

Paste in chat:

```text
Use qe-uat-gate. Call qe_intel_uat with:

feature: Release 2.4 — checkout promo ready for prod
release: { "rollback": "revert flag checkout.promo_v2", "monitoring": "promo_apply_failure_reason metric" }

Explore the repo, execute Phases A–D from the tool response, give GO/NO-GO in chat.
Do not save files unless I ask.
```

**Agent should:** one `qe_intel_uat` call → follow phases → optional `qe_intel_review` → save only on request.

---

## Artifact tools (Phase E only)

| Tool | Purpose |
|------|---------|
| `qe_validate_report` | JSON + evidence guards |
| `qe_save_report` | `.json` + `.html` |
| `qe_save_markdown` | `.md` |
| `qe_get_system_prompt` | Debug / full-tier rules |

See `skills/shared/artifact-run.md` in this package.

---

## Develop

```bash
npm install && npm run check && npm test
```

Local MCP:

```json
{
  "command": "node",
  "args": ["/ABSOLUTE/PATH/qe-intelligence-suite/qe-intel-mcp/dist/cli.js"],
  "env": { "REPO_ROOT": "/ABSOLUTE/PATH/to/target-repo" }
}
```
