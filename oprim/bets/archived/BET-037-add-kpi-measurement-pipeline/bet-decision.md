# Decision: BET-037 Add KPI measurement pipeline

> Reconstructed retroactively from `openspec/changes/archive/2026-05-23-kpi-measurement-pipeline/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-05-23
- Owner: Eshane
- Review date: 2026-05-23

## Why now
- `criteria.yaml` defined what to measure and where the data lived, but the review flow was entirely manual — a user had to pull numbers from Amplitude or BigQuery themselves and type them in
- The pipeline to translate criteria contracts into runnable queries and feed actuals back into reviews didn't exist yet

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- `oprim measure BET-NNN` reads `criteria.yaml` and emits runnable measurement definitions (Amplitude JSON, BigQuery SQL); a measurement execution step calls the Amplitude/BigQuery APIs and writes a `run-YYYY-MM-DD.yaml` result; `/oprim:review` auto-populates from a completed run when one exists

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-05-23-kpi-measurement-pipeline/`
