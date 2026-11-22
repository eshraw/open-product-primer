# Decision: BET-082 Add a Databricks source for oprim measure
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Defer
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2027-03-01

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — only valuable for teams whose KPIs live in Databricks; unknown how many.
- **Usability risk**: Low — mirrors the existing `bigquery` source shape in `criteria.yaml`.
- **Feasibility risk**: Medium — new auth model (workspace token / OAuth) and SQL dialect in `lib/measure.ts`.
- **Business viability risk**: Low — optional backend.

## Why now
- Deferred: captured during portfolio-mode scoping (PDR-001) as explicitly out of scope, so it isn't lost.

## Alternatives considered
- Fold into portfolio-mode bets — rejected: measurement backends are product-owned per PDR-001, unrelated to portfolio mode.

## Expected outcomes
- `source.type: databricks` in `criteria.yaml`, executed by `oprim measure` like `bigquery`.

## Kill criteria / rollback trigger
- No requesting team by the review date → Kill.

## Links
- PDRs: None
- Objectives: None
- OpenSpec change: <to be filled when promoted>
