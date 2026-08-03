# Decision: BET-031 Add a current decisions rollup view
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — helps orient on accumulated PDRs, but only pays off once a project has enough decisions to be hard to scan
- **Usability risk**: Low — a generated, read-only view is easy to consume
- **Feasibility risk**: Low — reads `oprim/decisions/` status fields and renders markdown, mirroring the existing `generate-sequence-view.js` script
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- oprim PDRs evolve by **supersession** (`Status: … | Superseded by PDR-YYY`), so over time `oprim/decisions/` mixes Accepted and superseded records with no at-a-glance "what have we currently decided" surface
- This is the decisions-layer analog of `sequence-view.md` — a **generated rollup view, not a new source of truth**, and explicitly NOT a spec-style delta-merge model (which would clash with the PDR supersession/immutability model — see BET-024)
- Reframed down from an earlier "living product-decision truth" idea, which was rejected precisely because oprim already answers decision evolution via supersession
- Deferred: low priority; only becomes useful once a project accumulates several PDRs

## Alternatives considered
- Read `oprim/decisions/` directly and rely on the `Status` field (status quo)
- Apply a spec-style delta-merge "living truth" to decisions (rejected — conflicts with the PDR supersession model; decisions layer and spec layer keep separate truth mechanics by design)

## Expected outcomes
- A generated view lists currently-Accepted PDRs with superseded ones collapsed and linked to their successors
- Faster orientation on the current decision set without reading every PDR file

## Kill criteria / rollback trigger
- Projects rarely accumulate enough PDRs for the view to matter, or the `Status` field alone proves sufficient

## Links
- PDRs: None
- OpenSpec change: N/A (native oprim spec)
- Spec (delta): oprim/bets/pending/BET-031-add-a-current-decisions-rollup-view/specs/decisions-view-scaffold/spec.md
- Criteria: none defined yet — consider adding oprim/bets/pending/BET-031-add-a-current-decisions-rollup-view/criteria.yaml before archiving
- Relates to: BET-024 (contrast — supersession vs. delta-merge truth models)
