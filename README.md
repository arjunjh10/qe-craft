# QE Craft

Your QE expertise, inside every developer's IDE.  
No API keys. No new accounts. No extra tools to learn.

```bash
npx @qe-craft/mcp init
```

---

## The problem this solves

QA knowledge doesn't scale. One QE engineer, ten dev teams, every story groomed without them.

Most teams either skip QE analysis entirely or wait for a review that comes too late to change anything. Not because they don't care — because the friction is too high.

QE Craft puts senior QE thinking directly inside Cursor (and any MCP-compatible IDE), so developers and QA can get a proper risk analysis, test scenarios, and a GO/NO-GO recommendation without leaving their editor, without an API key, and without reading a QE handbook first.

---

## How it works

There is no AI inside the MCP server. No external API calls from MCP. The server does not add a **second** cloud LLM hop — your IDE's own AI does the reasoning; see **[`docs/data-handling.md`](docs/data-handling.md)** for what stays local vs what your IDE provider handles.

QE Craft gives that model the QE framework to reason with — skills that turn a vague "analyse this story" into structured senior QE analysis every time.

```
Developer types:   "refinement on this story: [pastes ticket]"
Cursor calls:      qe_intel_refinement
MCP returns:       phased playbook — what to look for, where to look
Cursor runs:       risks, gaps, test scenarios, questions — in chat
Optional:          save as HTML report to docs/qe-analysis/
```

---

## Install

**Step 1 — Add the MCP server to Cursor**

In `~/.cursor/mcp.json`:

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

**Step 2 — Install the QE skills**

```bash
npx @qe-craft/mcp init
```

This copies seven QE skills into `~/.cursor/skills/`. Restart Cursor.

That's it. No API key. No account. No config files to fill in.

MCP tool names (`qe_intel_*`, etc.) are unchanged — only the npm package and MCP server key use the `qe-craft` / `@qe-craft/mcp` IDs.

---

## What you get

Five analysis modes, triggered by natural language in Cursor:

| Say something like... | Mode | What it does |
|---|---|---|
| "Refine this story" | `REFINEMENT` | Gaps, missing AC, risks before dev starts |
| "Is this ready to release?" | `UAT` | GO/NO-GO with execution plan |
| "No ticket, validate this feature area" | `REPO_UAT` | Codebase-grounded charter |
| "Why did this bug happen?" | `BUG` | Root cause + missed coverage |
| "What do I need to retest?" | `REGRESSION` | Impact scope + automation to run |

**Also:** `qe-automate` — Cursor skill for test writing (no MCP tool; pairs with the modes above).

Output is in chat by default. Ask Cursor to save it and you get a tabbed HTML report under `docs/qe-analysis/` — structured, shareable, linkable.

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

QE Craft has no server-side AI. MCP validates and saves locally; generation stays in the IDE model your company already approved for Cursor or Copilot. Details: **[`docs/data-handling.md`](docs/data-handling.md)**.

---

## What's in the repo

```
mcp/                   MCP server — install once, use everywhere
docs/qe-analysis/      Sample outputs (committed, so you can see before installing)
```

Package README (tools, architecture, maintainer publish): [`mcp/README.md`](mcp/README.md).

---

## Philosophy

Most AI testing tools compete on feature count. QE Craft competes on adoption.

A tool that requires four steps to install will be skipped. A tool that requires an API key will be blocked by security. A tool with 60 agents will confuse the developer who just wants to know if a story is testable.

One command. Zero keys. Works in the IDE you already have.

---

## Built by

An SDET actively piloting AI-assisted QE workflows in production — not a theoretical implementation.

[Portfolio](https://www.arjunjhawar.dev) · [npm](https://www.npmjs.com/package/@qe-craft/mcp)
