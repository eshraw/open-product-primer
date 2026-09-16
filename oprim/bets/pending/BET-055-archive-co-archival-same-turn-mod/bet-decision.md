# Decision: BET-055 Streamline archive co-archival into single turn

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [ ] 2-way door
- [x] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — closes a real gap (co-archival prompt can arrive a whole session later via session-Stop), but the existing flag-file mechanism already works
- **Usability risk**: Low — same prompt, just earlier and same-turn instead of at session end
- **Feasibility risk**: High — depends on unverified hooks system; also would replace, not just add to, the existing `on-prompt-submit.sh`/`on-stop.sh` hook pair, so needs careful migration to avoid double-prompting or dropped prompts
- **Business viability risk**: Low — internal tooling only

## Why now
- The current `on-prompt-submit.sh`/`on-stop.sh` flag-file dance only prompts co-archival at session Stop, which can be a whole session later than the actual `/opsx:archive` invocation
- A direct intercept on `/opsx:archive` could resolve the linked bet and prompt `/oprim:archive` in the same turn

## Alternatives considered
- Status quo: two-hook flag-file mechanism (works today, but delayed to session end)

## Expected outcomes
- Time between OpenSpec archive and oprim bet co-archive prompt: session-end → same-turn

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If it conflicts with the existing `on-prompt-submit.sh`/`on-stop.sh` hooks in a way that's hard to reconcile without breaking the current (working) behavior, kill — marked 1-way door because replacing a working hook pair risks regressing co-archival entirely if the migration goes wrong

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
