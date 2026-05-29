# QE Intel — artifacts (Phase E only)

Use when the user wants a **saved** record under `docs/qe-analysis/`.

## JSON + HTML

1. `qe_get_json_schema` (if needed)
2. Agent produces JSON in thread
3. `qe_validate_report` — pass `evidence_context` from exploration
4. `qe_save_report` — envelope from validate step

## Markdown

- `qe_save_markdown` with sections 1–11, or
- Local write per deliverable rules in full-tier prompt

## Debug / full rules

- `qe_get_system_prompt` — full senior prompt without re-running intel

**Opt-out:** chat only / do not save → skip this file entirely.
