# Install QE Craft

One page for every IDE. QE Craft ships as an **MCP server** (`@qe-craft/mcp` on npm) plus **agent skills** that route your IDE assistant through senior QE workflows. No API key required.

**Primary install:** Cursor or Claude Code marketplace plugin (skills + MCP bundled).  
**Everything else:** same MCP server; add MCP config and optionally copy skills with the setup CLI.

Privacy and data paths: **[`docs/data-handling.md`](data-handling.md)**.

---

## Install matrix

| Client | Tier | Skills auto-loaded? | What to do |
|--------|------|---------------------|------------|
| **Cursor** | A — full plugin | Yes | [Cursor Marketplace](https://cursor.com/marketplace) or local plugin symlink |
| **Claude Code** | A — full plugin | Yes | [Claude plugin directory](https://claude.ai/settings/plugins) or `claude --plugin-dir ./plugin` |
| **VS Code / GitHub Copilot** | B — MCP + instructions | No | `setup --ide vscode --project <repo>` or manual `.vscode/mcp.json` |
| **Visual Studio 2022+** | B/C | No | MCP Server Manager / registry — same stdio config, host-specific path |
| **JetBrains, Windsurf, Cline, Continue, Zed** | B/C | No | Host MCP config + optional repo `AGENTS.md` / Copilot-style instructions |
| **Claude Desktop** | C — MCP only | No | Desktop MCP settings — tools only, no bundled skills |
| **Any stdio MCP host** | C | No | Paste MCP snippet below into host config |

**Tier A** = marketplace plugin (`plugin/` bundle: manifests, skills, `mcp.json`).  
**Tier B** = MCP config + install doc; agent reads skills from repo instructions or pasted rules.  
**Tier C** = MCP tools only (`qe_intel_*`, validate, save).

Plugin bundle details and marketplace checklists: **[`plugin/README.md`](../plugin/README.md)**.

---

## Before you start

### Set `REPO_ROOT`

The MCP server scans and saves artifacts under **`REPO_ROOT`** (defaults to the process working directory if unset).

When your IDE workspace is **not** the service under test — monorepos, multi-root VS Code workspaces, opening a parent folder — set `REPO_ROOT` to the target app path:

```json
"env": {
  "REPO_ROOT": "/absolute/path/to/target-repo"
}
```

The bundled plugin uses `${workspaceFolder}`; override when that folder is wrong.

### MCP server entry (all clients)

```json
{
  "mcpServers": {
    "qe-craft": {
      "command": "npx",
      "args": ["-y", "@qe-craft/mcp@latest"],
      "env": {
        "REPO_ROOT": "/absolute/path/to/your/repo"
      }
    }
  }
}
```

Pin a version for reproducible installs: `"args": ["-y", "@qe-craft/mcp@1.0.1"]`.

### Config file locations

| Client | Typical MCP config path |
|--------|-------------------------|
| Cursor (global) | `~/.cursor/mcp.json` |
| Cursor (project) | `.cursor/mcp.json` |
| Cursor (plugin) | `plugin/mcp.json` (auto-discovered) |
| Claude Code (plugin) | `plugin/.mcp.json` (auto-discovered) |
| VS Code / Copilot | `.vscode/mcp.json` |
| Claude Desktop | `claude_desktop_config.json` (OS-specific; see Anthropic docs) |

Consult your host's MCP documentation if the path differs.

---

## Cursor

### Marketplace (recommended)

1. Install **QE Craft** from the [Cursor Marketplace](https://cursor.com/marketplace) when published.
2. Reload Cursor and enable the **qe-craft** MCP server in MCP settings.

Skills and MCP config ship in the plugin — no separate `init` step.

### Local plugin test (contributors)

```bash
ln -s "$(pwd)/plugin" ~/.cursor/plugins/local/qe-craft
```

Reload Cursor, enable MCP, run a refinement flow in chat.

### Manual setup (power users)

```bash
npx @qe-craft/mcp setup --ide cursor              # global skills → ~/.cursor/skills
npx @qe-craft/mcp setup --ide cursor --project .   # project skills → .cursor/skills
```

Add the MCP snippet to `~/.cursor/mcp.json` (or project `.cursor/mcp.json`), reload, enable MCP.

Legacy alias: `npx @qe-craft/mcp init` (same as `setup --ide cursor`).

---

## Claude Code

### Marketplace (recommended)

1. Install from the [Claude plugin directory](https://claude.ai/settings/plugins) when published.
2. Enable MCP for the plugin session.

Skills are namespaced at runtime, e.g. **`/qe-craft:qe-refinement`**.

### Local test

```bash
claude --plugin-dir ./plugin
```

Validate bundle before submit:

```bash
claude plugin validate ./plugin
```

### Manual path

Claude Code does not use a standalone skills copy path like Cursor. Install the **plugin** (marketplace or `--plugin-dir`). For plugin development:

```bash
npx @qe-craft/mcp setup --plugin-dir ./plugin
```

---

## VS Code / GitHub Copilot

VS Code has no skill-plugin marketplace equivalent to Cursor/Claude. You get **MCP tools** plus optional **repo instructions** for skill routing.

### Automated (recommended)

```bash
npx @qe-craft/mcp setup --ide vscode --project /path/to/your/repo
```

Writes `.vscode/mcp.json` with `REPO_ROOT: "${workspaceFolder}"`.

### Manual

Create `.vscode/mcp.json` in your repo with the MCP snippet above (use `${workspaceFolder}` for `REPO_ROOT` when appropriate).

Then:

1. Reload VS Code or run **MCP: Add Server** / enable MCP in Copilot settings (per your VS Code version).
2. If workspace ≠ target repo, fix `REPO_ROOT` in the config.
3. Optionally add repo-level agent instructions (`AGENTS.md` or `.github/copilot-instructions.md`) so Copilot follows QE Craft skill triggers — see skill text in [`mcp/skills/`](../mcp/skills/) or install the plugin skills as reference.

---

## Other MCP clients

Use the same stdio MCP entry. Steps:

1. Add the MCP snippet to your host's config (see host docs).
2. Set `REPO_ROOT` to the repository you analyze.
3. Reload the client and enable the **qe-craft** server.
4. Paste or commit skill routing instructions if the host has no skill discovery (Tier B/C).

**Claude Desktop:** MCP tools work; bundled QE skills are not auto-loaded — describe the workflow in chat or paste skill excerpts.

**Corporate proxy / air-gapped:** If `npx` cannot download, install globally (`npm i -g @qe-craft/mcp`) and point `command` at `qe-craft-mcp` or `node /path/to/dist/server.js`. MCP itself makes no outbound HTTP calls; `npx` may need network once.

---

## Setup CLI reference

```bash
npx @qe-craft/mcp setup [options]
```

| Option | Purpose |
|--------|---------|
| `--ide cursor` | Copy skills to Cursor paths (default) |
| `--ide claude` | Print Claude plugin install instructions |
| `--ide vscode` | Write `.vscode/mcp.json` (**requires `--project`**) |
| `--ide all` | Run cursor + claude instructions + vscode (vscode still needs `--project`) |
| `--project <path>` | Project root for Cursor project skills or VS Code MCP |
| `--plugin-dir <path>` | Sync skills into a plugin folder (dev workflow) |
| `--force` | Overwrite existing files |
| `--dry-run` | Preview paths only |

Installs seven skills: `qe-analysis`, `qe-refinement`, `qe-uat-gate`, `qe-repo-charter`, `qe-incident`, `qe-regression-impact`, `qe-automate`.

---

## Verify install

1. Reload your IDE (or start a new agent session).
2. Confirm **qe-craft** appears in MCP settings and is enabled.
3. In chat, try: *"Refine this story: [paste AC]"* — the agent should call **`qe_intel_refinement`**.
4. Optional: run validate/save after a structured report (`qe_validate_report`, `qe_save_report`).

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| MCP server not listed | Reload IDE; check config path for your host |
| Tools fail / wrong repo scanned | Set `REPO_ROOT` to the target app path |
| Skills not triggering (Tier B/C) | Add MCP **and** repo instructions; Tier A plugin includes skills |
| Skill overwrite blocked | Re-run with `--force` or delete existing `SKILL.md` |
| `npx` download blocked | Global install or pinned local `node dist/server.js` |
| Cursor skills but no MCP | Install both — agent needs MCP for `qe_intel_*` calls |

---

## Related

- **[README](../README.md)** — product overview and samples
- **[`plugin/README.md`](../plugin/README.md)** — plugin bundle, versioning, submission
- **[`mcp/README.md`](../mcp/README.md)** — MCP tools, architecture, maintainer publish
- **[`docs/data-handling.md`](data-handling.md)** — privacy and two-hop data model
