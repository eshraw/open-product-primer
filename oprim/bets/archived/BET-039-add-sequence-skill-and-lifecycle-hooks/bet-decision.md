# Decision: BET-039 Add oprim-sequence skill and lifecycle hooks

> Reconstructed retroactively from `openspec/changes/archive/2026-06-24-oprim-sequence-skill-and-lifecycle-hooks/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-06-24
- Owner: Eshane
- Review date: 2026-06-24

## Why now
- The sequencing board fell out of date because editing `sequence.yaml` by hand is mechanical, nothing triggers when something changes (a bet archived, a bet created), and `/oprim:sequence` required users to arrive with a clear intention they often didn't have
- Result: the board drifted and nobody sequenced

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- A new `oprim-sequence` skill owns board health computation, triage mode (no intention), seeded mode (context from a hook), and YAML execution with diff preview; `sequence.md` becomes a one-line wrapper; `on-prompt-submit.sh`/`on-stop.sh` detect `/oprim:bet` and `/oprim:promote` invocations and surface non-blocking sequencing nudges

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-06-24-oprim-sequence-skill-and-lifecycle-hooks/`
