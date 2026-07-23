# Decision: BET-024 Adopt change and current spec dir lifecycle
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-08-31

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — the change/current + delta-merge model is proven in OpenSpec, but its value depends on native spec authoring (BET-023) landing first
- **Usability risk**: Medium — the ADDED/MODIFIED/REMOVED delta discipline introduces concepts users must learn to keep current specs trustworthy
- **Feasibility risk**: Medium — directory scaffolding is easy, but the merge-on-archive logic (matching requirements by header, folding deltas into current truth) is the tricky part
- **Business viability risk**: Low — no licensing or ops concerns; reuses oprim's existing archive flow

## Why now
- Pairs directly with native specs (BET-023) — a spec directory lifecycle is meaningless without a spec syntax to populate it
- OpenSpec's model is well-proven: `specs/` = current truth, `changes/<name>/specs/` = deltas, archive folds deltas back into truth (note: current specs live flat under `specs/`, not under `specs/current/`)
- It maps onto oprim's existing bet → archive flow, giving oprim a notion of "how did our product truth change" rather than an append-only pile
- oprim is already reshaping its workspace structure for OKF (BET-022) — a coherent moment to define the spec dir model

## Alternatives considered
- Append-only specs with no current-vs-delta distinction
- Nest current specs under `specs/current/` (OpenSpec keeps them flat under `specs/` — no `current/` nesting)
- Reuse the `openspec/changes` directory directly rather than an oprim-native structure

## Expected outcomes
- oprim maintains a current-truth spec set plus per-change delta specs that merge on archive
- Completed bets fold their spec deltas (ADDED/MODIFIED/REMOVED) into current truth automatically on archive
- Multiple in-flight changes can proceed in parallel without colliding on the same spec files

## Design constraint: generalist-first, spec layer optional
- The change/current spec structure is only scaffolded when the user opts into the spec layer at `oprim init` / `oprim update` — same choice that gates BET-023
- oprim remains product-decision-first; specs are an optional sublayer beneath bets, not a mandatory workspace
- Delta-merge (ADDED/MODIFIED/REMOVED → current truth) applies to the **spec layer only** — it deliberately does NOT apply to PDRs, which evolve by supersession (`Superseded by PDR-YYY`); the two truth models stay separate by design

## Kill criteria / rollback trigger
- Delta-merge conflicts on archive prove too error-prone without heavy tooling, eroding trust in the current spec set
- The distinction adds ceremony without users perceiving a benefit after a trial period

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Blocked by: BET-023 (native spec syntax)
- Unlocks: BET-026 (remote stores), BET-028 (validate)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/concepts.md
