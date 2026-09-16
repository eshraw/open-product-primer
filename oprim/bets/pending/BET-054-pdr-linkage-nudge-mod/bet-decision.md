# Decision: BET-054 Nudge PDR linkage during bet creation mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — improves PDR↔bet traceability, but unclear how many bets genuinely warrant a PDR link vs. being fine standalone
- **Usability risk**: Medium — risk of nagging on fast, low-ceremony bet capture (a documented product goal of oprim); needs to be dismissible, not blocking
- **Feasibility risk**: High — depends on unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- Bets can currently be created with no linked PDR and no prompt at all; a hook on the `oprim-bet` skill could nudge for a link before `bet-decision.md` is written

## Alternatives considered
- Status quo: PDR linkage is optional and unenforced, left entirely to author discipline

## Expected outcomes
- % of new bets with a linked PDR: baseline TBD (measure current rate first) → higher, measured post-rollout

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If the nudge measurably slows down or discourages bet capture, kill (conflicts with oprim's fast-capture goal — see BET-019)

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
