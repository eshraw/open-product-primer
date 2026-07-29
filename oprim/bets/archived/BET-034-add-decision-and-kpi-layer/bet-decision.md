# Decision: BET-034 Add Open Product Primer decision and KPI layer

> Reconstructed retroactively from `openspec/changes/archive/2026-05-20-add-open-product-primer-decision-and-kpi-layer/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-05-20
- Owner: Eshane
- Review date: 2026-05-20

## Why now
- Teams already using OpenSpec and Graphify can define and implement changes quickly, but they still lack a durable decision layer for product prioritization and post-launch learning
- The missing capability is deciding what to build in what order, preserving why decisions were made, and automatically comparing expected outcomes to KPI results

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- A Product Decision Intelligence layer (Open Product Primer / `oprim`) that complements OpenSpec without duplicating implementation details: PDRs, sequencing (Now/Next/Later), a KPI automation pipeline, a bet-to-OpenSpec promotion contract, ready-to-use templates, and a reproducible `init`/`update`/`doctor` install model

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-05-20-add-open-product-primer-decision-and-kpi-layer/`
