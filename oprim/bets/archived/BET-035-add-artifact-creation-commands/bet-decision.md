# Decision: BET-035 Add oprim artifact creation commands

> Reconstructed retroactively from `openspec/changes/archive/2026-05-21-add-oprim-artifact-creation-commands/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-05-21
- Owner: Eshane
- Review date: 2026-05-21

## Why now
- Open Product Primer had templates and a `primer/` scaffold but no agent commands to actually create or populate artifacts — users had to manually copy templates, assign IDs, and fill in structure
- Every PDR, bet, criteria contract, and KPI review requires the same repetitive scaffolding that an agent should handle

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- `/oprim:pdr`, `/oprim:bet`, `/oprim:criteria`, and `/oprim:review` commands scaffold their respective artifacts with auto-assigned IDs and guided prompting, and bet creation automatically adds a sequencing board entry

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-05-21-add-oprim-artifact-creation-commands/`
