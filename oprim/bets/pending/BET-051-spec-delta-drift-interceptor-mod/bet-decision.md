# Decision: BET-051 Catch spec-delta drift live via interceptor mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — shortens feedback loop on a real failure mode (a bet's delta drifting from current-truth spec) that today is only caught at CI/validate time
- **Usability risk**: Low — same check as `checkSpecDeltaDrift()`, just surfaced earlier and inline
- **Feasibility risk**: High — depends on unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` hooks system; also unclear if file-content-aware checks are feasible in that hook model
- **Business viability risk**: Low — internal tooling only

## Why now
- `checkSpecDeltaDrift()` (`lib/validate-checks.ts`) already exists but only runs at `oprim validate` time, after a MODIFIED/REMOVED requirement header may have already drifted from `oprim/specs/<capability>/spec.md`
- Reuses existing logic; no new drift-detection code needed

## Alternatives considered
- Rely on CI-gated `oprim validate --strict` (status quo) — catches drift, but only at PR/CI time, not at authoring time

## Expected outcomes
- Spec-delta header mismatches surfaced: validate/CI time → edit time (same session as the drift is introduced)

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize, or proves unreliable for file-content-aware checks, by review date, kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
