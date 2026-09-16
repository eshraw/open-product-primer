# Decision: BET-053 Gate promote command on definition-of-done mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — prevents a bet being promoted without a `criteria.yaml`, a state `oprim validate` currently only flags after the fact
- **Usability risk**: Medium — a hard pre-block on `/oprim:promote` risks being disruptive if it fires on legitimate edge cases; needs to be a nudge, not a silent hard-fail
- **Feasibility risk**: High — depends on unverified hooks system; also requires intercepting a slash-command workflow, not just a file write
- **Business viability risk**: Low — internal tooling only

## Why now
- `checkBetDefinitionOfDone()` (`lib/validate-checks.ts`) already flags a promoted bet missing `criteria.yaml`, but only after promotion; a pre-hook could block before the OpenSpec change is even created

## Alternatives considered
- Status quo: validate catches it after the fact, requiring manual cleanup of an already-promoted bet

## Expected outcomes
- Bets promoted without `criteria.yaml`: caught after promotion (requires cleanup) → blocked at promote time (0 such bets reach OpenSpec)

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If the gate proves too disruptive to legitimate promote flows, kill or convert to a warning-only nudge

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
