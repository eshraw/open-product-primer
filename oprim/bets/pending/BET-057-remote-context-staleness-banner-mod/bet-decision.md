# Decision: BET-057 Surface remote-context staleness via banner mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — remote-context sources can silently degrade to a stale/last-known-good clone on fetch failure today; that's currently invisible at point-of-use
- **Usability risk**: Low — a banner is additive, doesn't change existing behavior when the cache is fresh
- **Feasibility risk**: High — depends on unverified hooks system; also needs the hook to run before remote content is folded into a suggestion, not just on the read itself
- **Business viability risk**: Low — internal tooling only

## Why now
- Remote-context sources cache with a 5-minute throttle (`lib/remote-context.ts`) and can silently degrade to stale/last-known-good on clone failure
- `oprim doctor` validates sources *resolve*, but doesn't surface staleness at the point a stale source is actually used in a suggestion

## Alternatives considered
- Status quo: doctor validates resolution, but staleness isn't surfaced at point-of-use

## Expected outcomes
- Stale/degraded remote-context usage surfaced at point-of-use: 0% → 100%

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
