# Decision: BET-080 Add PM inbox and daily-planning workflows for portfolio mode
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2026-12-19

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: High — the whole "PM assistant" premise rests on a PM using capture/triage/start-day daily; unvalidated.
- **Usability risk**: Medium — five new workflows plus an "ask first" rule; must feel faster than a notes app.
- **Feasibility risk**: Medium — five workflows × (schema, template, Cursor command, inline variant); the "ask first" rule must touch existing bet/pdr/criteria templates without changing product-mode output. Mode-gated install itself lands in BET-075.
- **Business viability risk**: Low — workflows only, no external services required (Calendar/Slack are optional MCPs).

## Why now
- This is the value probe from PDR-001's rejected approach (c): workflows that are useful on day one, even with zero linked products, so we learn whether a PM uses the repo daily before investing in delegation/comms.
- Only depends on the scaffold (BET-075): `inbox.md`, `STATE.md`, `wiki/`.
- Overlaps BET-019 (quick-capture for bets); `oprim-capture` is the portfolio-mode answer and may subsume it.

## Alternatives considered
- Ship as forked workflows under `oprim/workflows/` only — rejected: forks trip skill-drift checks and are not rendered for Cursor/inline agents by default.
- A CLI `oprim capture` command — rejected: oprim is agent-native; CLI handles setup only.
- Make Calendar/Slack mandatory for start-day/plan-week — rejected: workflows must work without any MCP.

## Expected outcomes
- `oprim-capture`, `/oprim:triage`, `/oprim:ingest`, `/oprim:start-day`, `/oprim:plan-week` exist as schema+template pairs with `modes: [portfolio]` (BET-075), installed for every agent only in portfolio mode, forkable via `oprim/workflows/`; product-mode installs stay byte-identical.
- An "ask first" rule (2–3 assumption questions before drafting a bet/PDR/criteria/comms) is on by default in portfolio mode, off in product mode, toggled by `rules.<workflow>.ask_first`.
- Nothing is written to a product workspace by triage/ingest without explicit confirmation.

## Kill criteria / rollback trigger
- After 2 weeks of dogfooding, `/oprim:start-day` used on < 5 of 10 working days or `inbox.md` grows without triage → stop BET-081 and rethink the PM-assistant premise.
- The "ask first" rule cannot be added to bet/pdr/criteria templates without changing product-mode installed output → ship it as separate portfolio-only wrapper workflows instead.

## Links
- PDRs: PDR-001
- Objectives: None
- OpenSpec change: <to be filled when promoted>
