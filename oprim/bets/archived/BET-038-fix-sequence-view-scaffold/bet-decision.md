# Decision: BET-038 Fix sequence view scaffold gap

> Reconstructed retroactively from `openspec/changes/archive/2026-06-09-fix-sequence-view-scaffold/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-06-09
- Owner: Eshane
- Review date: 2026-06-09

## Why now
- `generate-sequence-view.js` (introduced in 0.3.0) was hand-placed in this repo's `oprim/scripts/` directory but never wired into the CLI install path — every `oprim init` since 0.3.0 silently omitted it
- `oprim update` never refreshed workspace scripts (only agent skills), so even a manual placement wouldn't survive an update, and `/oprim:sequence` never told the AI to regenerate `oprim/sequence-view.md`, leaving it stale after any board change

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- `oprim init`/`oprim update` scaffold and refresh `oprim/scripts/generate-sequence-view.js` (via a `sequenceViewScriptTemplate` constant), and `/oprim:sequence` regenerates `oprim/sequence-view.md` as its final step, on all agents including Codex/Gemini

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-06-09-fix-sequence-view-scaffold/`
