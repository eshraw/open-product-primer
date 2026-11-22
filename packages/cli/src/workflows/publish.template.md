---
name: oprim-publish
description: Render a one-way, Notion-ready PRD from a local or qualified bet or PDR into outputs/publish/ — git stays the source of truth; uploads only when explicitly asked
---

Compose a readable PRD from a bet or PDR — its decision, success criteria and specs — as Notion-compatible markdown in `outputs/publish/`. Publishing is **one-way**: git stays the source of truth, the published page is a snapshot, and nothing is ever read back from Notion.

Usage: `/oprim:publish <ref>` where `<ref>` is `BET-NNN`, `PDR-NNN`, or a qualified `<source>:BET-NNN` / `<source>:PDR-NNN`.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Hard rules — never break these
- **Never call a Notion API or tool unless the user explicitly asks to upload** in this conversation. Writing the markdown file is the default and complete outcome.
- **Never read changes back from Notion** or edit any git file from Notion content.
- Never write into another workspace or under `~/.oprim/remote-context-cache/`. The only file written is `outputs/publish/<ref>.md`.
- Never invent content: every section comes from a file in git; leave out sections whose source is absent rather than padding them.

## Steps

### 1. Resolve the reference
Parse `<ref>`; if missing, ask for it. Accept `BET-4`, `bet-004` → `BET-004`.
- **Unqualified** → this workspace: `oprim/bets/pending/BET-NNN-*/` (then `oprim/bets/archived/BET-NNN-*/`), or `oprim/decisions/PDR-NNN-*.md`.
- **Qualified** `<source>:…` → `<source>` must be a registered `remote_context.sources` name in `oprim/config.yaml` (otherwise stop and suggest `oprim context register`). Read the bet or PDR via `oprim context --source <source>`.
If it does not resolve, stop and say which paths were checked.

### 2. Gather the content
For a **bet**:
- `bet-decision.md` — title, status, owner, review date, door type, risk profile, why now, alternatives, expected outcomes, kill criteria, links.
- `criteria.yaml` if present — each metric's name, baseline, target, timeframe and source.
- Specs if present — the bet's own deltas under `specs/<capability>/spec.md`, else the current-truth `oprim/specs/<capability>/spec.md` for capabilities it touches; plus `design.md` if present. If the bet links an OpenSpec change, include its proposal summary when readable.
- Linked PDRs and objectives — title and one-line summary each.

For a **PDR**: context, decision, consequences, alternatives and status, plus the bets that link to it.

### 3. Write the PRD
The filename is the ref with `:` replaced by `-`: `BET-031` → `outputs/publish/BET-031.md`, `checkout:BET-031` → `outputs/publish/checkout-BET-031.md`. Create `outputs/publish/` if needed; if the file exists, overwrite it (it is a snapshot) and say so.

Use only Notion-compatible markdown — headings, paragraphs, bullet and numbered lists, tables, quotes, fenced code blocks; no HTML, no footnotes, no Mermaid. Start with:

```
> Source of truth: <ref> in git. This page is a one-way snapshot published on <YYYY-MM-DD> — edit the source, not this page.

# <title>
```

where `<ref>` is exactly the reference the user gave, qualified if it was qualified (e.g. `Source of truth: checkout:BET-031 in git`). For a bet, then: **Summary** (status, owner, decision, review date), **Problem and why now**, **Goals and success metrics** (from `criteria.yaml` as a table), **Requirements** (from the specs: requirement names and their SHALL statements; scenarios as nested bullets), **Design notes**, **Risks** (risk profile and door type), **Alternatives considered**, **Kill criteria**, **Links**. For a PDR: **Summary**, **Context**, **Decision**, **Consequences**, **Alternatives**, **Related bets**.

### 4. Optional upload — only when explicitly asked
Ask: "Upload to Notion too? (y/N)" only if a Notion MCP tool is available in this session; otherwise skip silently. Only on an explicit yes, create (never update an existing page unless the user names it) a page with the file's content, and report its URL. Never read from Notion afterwards.

### 5. Report
Give the file path, the sources it was composed from, and any section left out for lack of a source.
