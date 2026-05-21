# QE Intel MCP (`qe-intel-mcp`)

stdio MCP server for **Senior QE analysis** in Cursor: validate JSON reports, apply evidence guards, render tabbed HTML, and save artifacts under `docs/qe-analysis/`. **No API key** — inference runs in your IDE agent.

Pair with the bundled **`qe-analysis` skill** (installed via `init`) so the agent knows when and how to call these MCP tools.

## Requirements

- Node.js **22+**
- Cursor (or any MCP client with stdio transport)

## Quick setup (recommended)

### 1. MCP — add to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`)

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

### 2. Skill — install from this package

```bash
npx qe-intel-mcp init
```

Team repo (commit skill in git):

```bash
npx qe-intel-mcp init --project /absolute/path/to/your-repo
```

Preview only:

```bash
npx qe-intel-mcp init --dry-run
```

Upgrade skill after a new MCP release:

```bash
npx qe-intel-mcp@latest init --force
```

### 3. Restart Cursor

**Migrating from `qe-refinement`:** use MCP key `qe-intel` and package `qe-intel-mcp@latest` in `args` (tool names unchanged).

Confirm **qe-intel** MCP is connected and the **qe-analysis** skill is listed.

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `REPO_ROOT` | No | Repo where `docs/qe-analysis/` is written (defaults to MCP process cwd) |

---

## Invoke QE via skill + MCP (examples)

The **skill** tells the agent *when* to run QE and the **7-step runbook**. **MCP tools** validate and save. Paste one of these into Cursor chat after setup.

### REFINEMENT (markdown)

```text
MODE: REFINEMENT

FEATURE / TICKET:
As a customer I want to apply a promo code at checkout so the order total reflects the discount before payment.

API:
- Endpoint: POST /checkout/promo
- Method: POST

EXISTING COVERAGE:
- E2E happy-path checkout without promo

Use the qe-analysis skill and QE Intel MCP. output_format=markdown. Save under docs/qe-analysis/.
```

**What the agent should do:** explore repo → optional `qe_get_system_prompt` (`mode: REFINEMENT`, `output_format: markdown`) → write sections ## 1–11 → `qe_save_markdown`.

### UAT (JSON + HTML)

```text
MODE: UAT

FEATURE / TICKET:
Release 2.4 — checkout promo flow ready for production.

RELEASE:
- Type: minor
- Rollback: revert checkout-api flag checkout.promo_v2

Use QE Intel MCP with output_format=json. Build evidence_context from the repo. Validate and save envelope + HTML.
```

**What the agent should do:** explore → `qe_get_system_prompt` (`mode: UAT`, `output_format: json`) + `qe_get_json_schema` → emit JSON → `qe_validate_report` (with `evidence_context`) → `qe_save_report`.

### REPO_UAT (no ticket)

```text
MODE: REPO_UAT

FEATURE / TICKET:
Promo code behaviour at checkout — infer scope from this repo.

REPO HINTS:
- apps/checkout, src/api/checkout, promotions-service clients

Use the skill runbook. JSON output. Do not cite paths you did not read.
```

**What the agent should do:** deep/shallow repo scan per skill → `qe_get_system_prompt` (`mode: REPO_UAT`, `output_format: json`, `related_repos` if applicable) → JSON with `goNoGo` → validate → save.

### Explicit MCP tool sequence (if the agent skips tools)

```text
Run Senior QE REFINEMENT using QE Intel MCP in order:
1. qe_get_system_prompt — mode REFINEMENT, output_format json
2. qe_get_json_schema
3. Explore the repo; build evidence_context (path:line bullets)
4. Produce report JSON in this thread
5. qe_validate_report — report_json + evidence_context + feature title
6. qe_save_report — envelope, mode REFINEMENT, title "Promo at checkout"
Reply with paths and validationWarnings.
```

---

## MCP tools

| Tool | Purpose |
|------|---------|
| `qe_get_system_prompt` | Assembled system prompt for mode + output format |
| `qe_get_json_schema` | JSON report schema description |
| `qe_validate_report` | Parse, Zod-validate, evidence guards, envelope |
| `qe_save_report` | Write `.json` + tabbed `.html` siblings |
| `qe_save_markdown` | Write `.md` analysis |

## Develop from source

```bash
git clone https://github.com/arjunjh10/qe-intelligence-suite.git
cd qe-intelligence-suite/qe-intel-mcp
npm install
npm run check
npm test
```

Local MCP (no npx):

```json
{
  "command": "node",
  "args": ["/ABSOLUTE/PATH/qe-intelligence-suite/qe-intel-mcp/dist/cli.js"],
  "env": { "REPO_ROOT": "/ABSOLUTE/PATH/to/target-repo" }
}
```

After editing the Cursor skill at `~/.cursor/skills/qe-analysis/SKILL.md`, sync into the package before release:

```bash
npm run sync-skill
```

## Publishing (maintainers)

```bash
npm login
npm run pack:check
npm publish --dry-run
npm publish
```

Bump `version` in `package.json` and `MCP_SERVER_VERSION` in `src/core/constants.ts` together before each release.
