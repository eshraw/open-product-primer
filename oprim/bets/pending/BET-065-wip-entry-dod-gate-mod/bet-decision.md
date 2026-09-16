# Decision: BET-065 Gate backlog-to-now moves on definition-of-done

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — front-loads definition-of-done discipline to the backlog→now transition, an earlier and scarcer commitment point (WIP limit: 2) than promote time
- **Usability risk**: Medium — risks being too heavy a gate for quick exploratory bets that don't need a discovery doc up front
- **Feasibility risk**: High — depends on unverified hooks system; overlaps in purpose with BET-053 (promote-time gate) and BET-016/doctor's existing WIP checks
- **Business viability risk**: Low — internal tooling only

## Why now
- `checkBetDefinitionOfDone()` only fires at promote time (BET-053 proposes gating promote); moving backlog→now is an earlier commitment point where missing groundwork could be caught before scarce WIP capacity is spent on it
- Complements, doesn't duplicate, BET-050's WIP-limit guard — this checks *readiness*, that checks *board integrity*

## Alternatives considered
- Status quo: no gate at backlog→now transition; definition-of-done is only checked later at promote time (or not at all until BET-053 ships)

## Expected outcomes
- Bets entering "now" without `criteria.yaml`/`discovery.md`: unchecked → flagged at the backlog→now transition

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If it proves too heavy a gate for quick exploratory bets, kill or make the discovery-doc check optional

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
