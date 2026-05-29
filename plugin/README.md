# QE Craft plugin

Install QE Craft skills and MCP configuration for Cursor or Claude Code from one bundle. The MCP runtime is the public npm package [`@qe-craft/mcp`](https://www.npmjs.com/package/@qe-craft/mcp) — no API key required.

## What you get

- **7 agent skills** — refinement, UAT, repo charter, incident, regression, test automation, and a router skill
- **MCP server config** — stdio `npx @qe-craft/mcp` with local validate/save tools
- **No hosted inference** — MCP is deterministic; your IDE agent does the analysis

## Install

### Cursor

1. Install from the [Cursor Marketplace](https://cursor.com/marketplace) (when published), or symlink this folder for local testing:
   ```bash
   ln -s "$(pwd)" ~/.cursor/plugins/local/qe-craft
   ```
2. Reload Cursor and enable the **qe-craft** MCP server in MCP settings.

### Claude Code

1. Install from the [Claude plugin directory](https://claude.ai/settings/plugins) (when published), or test locally:
   ```bash
   claude --plugin-dir ./plugin
   ```
2. Skills are namespaced at runtime, e.g. `/qe-craft:qe-refinement`.

Validate before submit:

```bash
claude plugin validate ./plugin
```

## Configuration

Set **`REPO_ROOT`** to the repository you are analyzing. The bundled `mcp.json` uses `${workspaceFolder}` by default. When your IDE workspace is not the service under test (monorepos, multi-root workspaces), point `REPO_ROOT` at the target app path.

Example override in your MCP config:

```json
"env": {
  "REPO_ROOT": "/absolute/path/to/target-repo"
}
```

## MCP tools

| Tool | Purpose |
|------|---------|
| `qe_intel_refinement` | Story / AC grooming playbook |
| `qe_intel_uat` | Release UAT / GO-NO-GO playbook |
| `qe_intel_repo_uat` | Repo exploration charter |
| `qe_intel_bug` | Production defect analysis |
| `qe_intel_regression` | Change-impact / retest scope |
| `qe_intel_review` | Draft critique before save |
| `qe_validate_report` | Validate report JSON (Phase E) |
| `qe_save_report` | Save HTML report locally |

## Privacy

MCP does not call external LLMs. Repo exploration and report generation use your IDE agent — a separate data path governed by your IDE vendor. See **[`docs/data-handling.md`](../docs/data-handling.md)** in the repo root.

## Troubleshooting

- **MCP not listed** — Reload the IDE after install; confirm MCP is enabled in settings.
- **Wrong repo scanned** — Fix `REPO_ROOT` in MCP env (see Configuration).
- **Skills missing** — Re-run `npm run build:plugin` from `mcp/` when developing this repo; do not edit `plugin/skills/` by hand.

## Security

Report security issues via [GitHub Issues](https://github.com/arjunjh10/qe-craft/issues). Review MCP source on GitHub before enabling in regulated environments.

## Version

Plugin `version` matches the `@qe-craft/mcp` npm release. Pin a specific version in `mcp.json` args for reproducible installs:

```json
"args": ["-y", "@qe-craft/mcp@1.0.1"]
```
