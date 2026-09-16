# Decision: BET-052 Surface cross-bet conflicts live via checker mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — two bets can silently draft conflicting requirement deltas for days before `oprim validate` catches it; earlier detection avoids wasted rework
- **Usability risk**: Medium — surfacing a conflict mid-authoring (vs. at validate time) needs careful framing so it reads as a heads-up, not a hard block, since the other bet's author may not be in this session
- **Feasibility risk**: High — depends on unverified hooks system; also needs read access to all active bets' deltas at hook time, not just the file being written
- **Business viability risk**: Low — internal tooling only

## Why now
- `findCrossBetConflicts()` (`lib/spec-delta.ts`) currently only runs in `oprim validate`; conflicting deltas across bets go undetected until then
- Same hook point as BET-051 (spec-delta writes), so could plausibly ship together

## Alternatives considered
- Status quo: catch conflicts only at validate/CI time

## Expected outcomes
- Cross-bet requirement conflicts surfaced: validate time → delta-authoring time

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If live conflict surfacing produces too many false positives (e.g. from in-progress, not-yet-committed deltas), kill or rescope

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
