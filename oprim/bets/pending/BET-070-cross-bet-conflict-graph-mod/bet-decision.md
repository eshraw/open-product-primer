# Decision: BET-070 Visualize cross-bet conflicts as a graph

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — mainly valuable once 3+ bets/requirements collide, where a text list (BET-052's proposed output, or `oprim validate`'s existing conflict report) gets hard to parse
- **Usability risk**: Low — additive visualization over existing conflict-detection output
- **Feasibility risk**: Medium — the on-demand version needs no hooks (can render over `oprim validate --json`'s existing `findCrossBetConflicts()` output today); a live-updating version would depend on BET-052 shipping, which itself depends on the unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- `findCrossBetConflicts()` (`lib/spec-delta.ts`) already produces conflict data via `oprim validate`; nothing renders it as a graph today, only a flat report

## Alternatives considered
- Status quo: flat text/JSON conflict report from `oprim validate`
- Wait for BET-052 (live detection) before building this — rejected as a hard dependency since the on-demand version can ship independently over existing `validate` output

## Expected outcomes
- Conflict visualization added on top of existing (or BET-052's live) detection, for cases with 3+ colliding bets/requirements where text lists get hard to parse

## Kill criteria / rollback trigger
- If conflicts in practice almost always involve just 2 bets (where a text warning is already clear enough), kill as low-value over the existing report

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
