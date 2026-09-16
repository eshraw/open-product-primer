# Decision: BET-064 Nudge overdue bet reviews at session start

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — every bet-decision.md has a Review date, but nothing checks it against today; overdue reviews currently rely on someone noticing
- **Usability risk**: Medium — needs to be a light nudge, not a session-start interruption every time, or it'll get ignored/muted
- **Feasibility risk**: High — depends on unverified hooks system; needs a session-start (or first tool call) hook point, not just file-write-triggered
- **Business viability risk**: Low — internal tooling only

## Why now
- Nothing today automatically checks a pending bet's `Review date` against the current date
- A hook at session start could scan pending bets and flag any past-due for a KPI review or kill decision

## Alternatives considered
- Status quo: no automated staleness check; relies on manual inspection or proactively running `oprim:review`

## Expected outcomes
- Overdue bet reviews surfaced: never automatically → at next session start after the review date passes

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If the nudge fires too often to be useful (e.g. widespread unrealistic review dates), fix review-date hygiene first or kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
