# Decision: BET-051 Catch spec-delta drift live via interceptor mod

## Status
- Decision: Build now
- Date: 2026-09-17
- Owner: Eshane Rawat
- Review date: 2026-10-17

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — shortens feedback loop on a real failure mode (a bet's delta drifting from current-truth spec) that today is only caught at CI/validate time
- **Usability risk**: Low — same check as `checkSpecDeltaDrift()`, just surfaced earlier and inline
- **Feasibility risk**: Low-Medium — `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is confirmed as a real, official Claude Code beta feature (anthropics/claude-code#91870), not an unverified rumor; remaining unknown is whether file-content-aware checks are feasible in that hook model
- **Business viability risk**: Low — internal tooling only

## Capabilities
- claude-mods (ADDED) — general install/selection surface for function-hook-based "claude mods," first populated by the spec-delta-drift interceptor below
- spec-delta-drift-interceptor (ADDED) — the live hook itself
- init-agent-selection (MODIFIED) — a second, mod-selection prompt after Claude Code is chosen as an agent

## Why now
- `checkSpecDeltaDrift()` (`lib/validate-checks.ts`) already exists but only runs at `oprim validate` time, after a MODIFIED/REMOVED requirement header may have already drifted from `oprim/specs/<capability>/spec.md`
- Reuses existing logic; no new drift-detection code needed
- This is the first of 16 deferred hook-based mods (BET-050, BET-052–066) now that `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is confirmed real — an install surface (`claude-mods`) is needed so future mods can plug in without a new install-agent code path each time; scoping that surface into this promotion avoids building it as a one-off later

## Alternatives considered
- Rely on CI-gated `oprim validate --strict` (status quo) — catches drift, but only at PR/CI time, not at authoring time
- Auto-enable this mod for every Claude Code install with no opt-in — rejected: mods are per-project opt-in since they depend on a beta hooks feature and some (e.g. BET-053's promote gate) can be disruptive if forced on

## Expected outcomes
- Spec-delta header mismatches surfaced: validate/CI time → edit time (same session as the drift is introduced)
- A project can install this mod at `oprim init` time (second prompt, Claude agent only) or later via `oprim claude-mods` on an existing install

## Kill criteria / rollback trigger
- If `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` proves unreliable for file-content-aware checks in practice by review date, kill

## Links
- PDRs: None
- OpenSpec change: N/A (native spec framework)
- Spec (delta): oprim/bets/pending/BET-051-spec-delta-drift-interceptor-mod/specs/claude-mods/spec.md
- Spec (delta): oprim/bets/pending/BET-051-spec-delta-drift-interceptor-mod/specs/spec-delta-drift-interceptor/spec.md
- Spec (delta): oprim/bets/pending/BET-051-spec-delta-drift-interceptor-mod/specs/init-agent-selection/spec.md
- criteria.yaml: none yet — required before this bet can be archived per definition-of-done
