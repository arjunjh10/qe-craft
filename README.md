# QE Craft

Your QE expertise, inside every developer's IDE.  
No API keys. No new accounts. No extra tools to learn.

**Install:** pick your IDE in **[`docs/install.md`](docs/install.md)** — Cursor / Claude plugin (recommended), VS Code MCP, or manual setup.

```bash
# VS Code / Copilot — writes .vscode/mcp.json
npx @qe-craft/mcp setup --ide vscode --project /path/to/your/repo

# Cursor manual — copies skills (plugin install is preferred)
npx @qe-craft/mcp init
```

---

## The problem this solves

QA knowledge doesn't scale. One QE engineer, ten dev teams, every story groomed without them.

Most teams either skip QE analysis entirely or wait for a review that comes too late to change anything. Not because they don't care — because the friction is too high.

QE Craft puts senior QE thinking directly inside your IDE, so developers and QA can get a proper risk analysis, test scenarios, and a GO/NO-GO recommendation without leaving their editor, without an API key, and without reading a QE handbook first.

---

## How it works

There is no AI inside the MCP server. No external API calls from MCP. The server does not add a **second** cloud LLM hop — your IDE's own AI does the reasoning; see **[`docs/data-handling.md`](docs/data-handling.md)** for what stays local vs what your IDE provider handles.

QE Craft gives that model the QE framework to reason with — skills that turn a vague "analyse this story" into structured senior QE analysis every time.

```
Developer types:   "refinement on this story: [pastes ticket]"
Agent calls:       qe_intel_refinement
MCP returns:       phased playbook — what to look for, where to look
Agent runs:        risks, gaps, test scenarios, questions — in chat
Optional:          save as HTML report to docs/qe-analysis/
```

---

## Install

| Your IDE | Fastest path |
|----------|--------------|
| **Cursor** | [Cursor Marketplace](https://cursor.com/marketplace) plugin — skills + MCP bundled |
| **Claude Code** | [Claude plugin directory](https://claude.ai/settings/plugins) — skills namespaced `/qe-craft:…` |
| **VS Code / Copilot** | `npx @qe-craft/mcp setup --ide vscode --project <repo>` |
| **Other MCP client** | Add MCP snippet from install doc |

Full matrix, config paths, `REPO_ROOT`, troubleshooting, and power-user CLI: **[`docs/install.md`](docs/install.md)**.

No API key. No account. MCP tool names (`qe_intel_*`, etc.) are unchanged — only the npm package and MCP server key use the `qe-craft` / `@qe-craft/mcp` IDs.

---

## What you get

Five analysis modes, triggered by natural language in your IDE:

| Say something like... | Mode | What it does |
|---|---|---|
| "Refine this story" | `REFINEMENT` | Gaps, missing AC, risks before dev starts |
| "Is this ready to release?" | `UAT` | GO/NO-GO with execution plan |
| "No ticket, validate this feature area" | `REPO_UAT` | Codebase-grounded charter |
| "Why did this bug happen?" | `BUG` | Root cause + missed coverage |
| "What do I need to retest?" | `REGRESSION` | Impact scope + automation to run |

**Also:** `qe-automate` — skill for test writing (no MCP tool; pairs with the modes above).

Output is in chat by default. Ask the agent to save it and you get a tabbed HTML report under `docs/qe-analysis/` — structured, shareable, linkable.

---

## Sample output

Before you install anything — see what the output actually looks like:

**Markdown (v1):**
- [REFINEMENT — promo code at checkout](docs/qe-analysis/samples/qe-analysis-REFINEMENT-promo-code-checkout-2026-05-18.md)
- [UAT — checkout promo flow](docs/qe-analysis/samples/qe-analysis-UAT-checkout-promo-flow-2026-05-18.md)

**Tabbed HTML report (v2):** open in browser for the full experience:
- [REFINEMENT — promo code at checkout (HTML)](docs/qe-analysis/samples/v2/qe-analysis-REFINEMENT-promo-code-at-checkout-2026-05-21.html)
- [UAT — checkout promo flow (HTML)](docs/qe-analysis/samples/v2/qe-analysis-UAT-checkout-promo-flow-2026-05-21.html)

---

## Why no API key?

Other AI QE tools route your code through their servers or require you to bring an Anthropic/OpenAI key. That creates trust issues — especially in companies cautious about what leaves the network.

QE Craft has no server-side AI. MCP validates and saves locally; generation stays in the IDE model your company already approved (e.g. Copilot, Claude, or other MCP-capable assistants). Details: **[`docs/data-handling.md`](docs/data-handling.md)**.

---

## What's in the repo

```
mcp/                   MCP server — install once, use everywhere
plugin/                Cursor + Claude plugin bundle (skills + mcp.json)
docs/install.md        Per-IDE install matrix (canonical)
docs/qe-analysis/      Sample outputs (committed, so you can see before installing)
```

Package README (tools, architecture, maintainer publish): [`mcp/README.md`](mcp/README.md).

---

## Philosophy

Most AI testing tools compete on feature count. QE Craft competes on adoption.

A tool that requires four steps to install will be skipped. A tool that requires an API key will be blocked by security. A tool with 60 agents will confuse the developer who just wants to know if a story is testable.

One doc page. Zero keys. Works in the IDE you already have.

---

## Built by

An SDET actively piloting AI-assisted QE workflows in production — not a theoretical implementation.

[Portfolio](https://www.arjunjhawar.dev) · [npm](https://www.npmjs.com/package/@qe-craft/mcp)
