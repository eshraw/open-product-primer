# Design: BET-080 PM inbox and daily-planning workflows

## Context
Value probe for the whole initiative (PDR-001, approach (c)'s spirit): workflows a PM can use from day one with zero linked products. Install gating via `modes: [portfolio]` lands in BET-075.

## Decisions

### 1. Five workflows, each a full schema+template set
| id | Claude | Cursor | inline |
|---|---|---|---|
| `capture` | skill `oprim-capture` | skill | section |
| `triage` | skill + `/oprim:triage` | command | section |
| `ingest` | skill + `/oprim:ingest` | command | section |
| `start-day` | skill + `/oprim:start-day` | command | section |
| `plan-week` | skill + `/oprim:plan-week` | command | section |
Each ships `<id>.schema.yaml`, `<id>.template.md`, `<id>.cursor-command.md` (where a command exists), `<id>.inline.md`. All forkable via `oprim/workflows/`.

### 2. "Ask first" without changing product-mode output
Templates gain a delimited block:
```
<!-- oprim:portfolio:start -->
### 3c. Ask about assumptions first
…unless rules.<id>.ask_first is false…
<!-- oprim:portfolio:end -->
```
`workflow-renderer.ts` strips these blocks (including delimiters) when rendering for a product workspace, unless `rules.<id>.ask_first: true` — in which case it keeps the block. Product-mode output is therefore byte-identical by construction; a test asserts it against the pre-change snapshot (BET-075 task 1.3). Applied to `bet`, `pdr`, `criteria`, `objective` (BET-077) and the comms workflows (BET-081).

`rules.<id>` today is a string (custom instructions). `ask_first` needs a map: accept both shapes — `rules.bet: "text"` (existing) and `rules.bet: { text: "…", ask_first: false }` — and keep existing string configs valid. Flagged for review.

### 3. Determinism boundary
These workflows are prose by nature (routing, summarising). The deterministic pieces they rely on are already TS: `ovw --portfolio --json` (BET-079 — until it ships, workflows fall back to reading `sequence.yaml`), reference resolution (BET-076). Nothing new in `lib/` except the renderer block-stripping.

### 4. Inbox format
Checkbox lines, so triage progress is visible in any markdown viewer and "open items" is a simple parse (`- [ ]`). Destinations recorded inline with qualified refs.

### 5. Writes into products
Triage/ingest reuse the delegation rules (BET-078): local path → confirm then write; git → handoff file. Until BET-078 ships, routing to a product produces a handoff entry only.

## Alternatives considered
- Separate portfolio copies of bet/pdr/criteria templates with the ask-first step — rejected: duplicates content and forks drift.
- `inbox.yaml` — rejected: worse for fast human capture.

## Risks
- Value risk High (see bet). Track start-day usage for the kill criterion by the `Last commands` section of `STATE.md`.
- BET-019 (quick-capture for bets) overlaps `oprim-capture`; agreed 2026-11-21: kill BET-019 at this bet's review.
