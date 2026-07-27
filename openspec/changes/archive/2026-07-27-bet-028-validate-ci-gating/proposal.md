## Context

Originating bet: `BET-028` (`oprim/bets/BET-028-add-oprim-validate-with-strict-ci-gating/bet-decision.md`)
Blocked by (now shipped): `BET-024` (spec dir lifecycle — `openspec/changes/archive/2026-07-24-bet-024-spec-dir-lifecycle/`)
Relates to: `BET-027` (declarative workflow schemas, built in parallel on this branch)

## Why

Validation today is folded into `oprim doctor` (informational health check, no exit code discipline) and the interactive `/oprim:archive` skill (only checks conflicts at the moment of archiving, with a y/N prompt — not scriptable). There is no standalone, CI-runnable, machine-readable command a team can gate a merge or release on. BET-024 shipped the bet-directory spec-delta model but no accompanying validation, leaving three concrete gaps: no preview of what a delta will produce when folded into current truth, no check that a MODIFIED/REMOVED requirement's header still matches current truth before archive time, and no way to see cross-bet requirement conflicts except inside the archive prompt itself.

## What Changes

- Add a new `oprim validate` command with `--json` (machine-readable output) and `--strict` (treat warning-level findings as failures) flags and CI-appropriate exit codes (non-zero on any required failure, or on any failure at all under `--strict`).
- `validate` reuses the existing `checkSequenceIntegrity`/`checkSkillVersionDrift` checks (`lib/integrity.ts`) already used by `oprim doctor`, so the same integrity issues are gate-able in CI, not just visible in an interactive health check.
- Add a bet definition-of-done check: a bet whose `bet-decision.md` `## Links` section references an OpenSpec change (i.e., it has been promoted) SHALL have a `criteria.yaml` in its bet directory; flagged under `--strict`.
- Add a spec-delta dry-run preview: given a bet ID, compute and display the result of folding that bet's `specs/<capability>/spec.md` delta(s) into current truth (`oprim/specs/<capability>/spec.md`), using the same fold logic `/oprim:archive` uses, without writing any files.
- Add a delta drift check: for each active bet's spec delta, flag any `MODIFIED`/`REMOVED` requirement whose header no longer text-matches (whitespace-insensitive) a `### Requirement:` header in the corresponding `oprim/specs/<capability>/spec.md`.
- Add a cross-bet conflict check: extract this logic out of `/oprim:archive`'s Step 3 (currently only run at archive time, only for the bet being archived) into a reusable, on-demand check across *all* active bets' deltas, surfacing overlapping requirement headers and dangling `blocked_by`/`unlocks` references between them.
- `/oprim:archive`'s existing Step 3 conflict-detection prose is unaffected by this change — this refactor exposes the same class of check as a standalone, always-available command; it does not remove or replace the archive-time prompt.

## Capabilities

### New Capabilities
- `validate-command`: the `oprim validate [--json] [--strict]` CLI command — aggregates existing and new checks, produces machine-readable output, and returns CI-appropriate exit codes.
- `bet-definition-of-done`: the check that a promoted bet (one with an OpenSpec change linked) has a `criteria.yaml`, reported by `validate`.
- `spec-delta-preview`: dry-run computation and display of a bet's post-merge spec state, without writing files.
- `spec-delta-drift-detection`: flags a bet's MODIFIED/REMOVED delta requirements whose header no longer matches current truth.
- `cross-bet-conflict-detection`: on-demand surfacing of overlapping requirement headers and dangling sequence dependency references across all active bets, independent of `/oprim:archive`.

### Modified Capabilities
(none — `doctor-sequence-integrity` and `doctor-skill-version` requirements describe `oprim doctor`'s own behavior, which is unchanged; `validate` calls the same underlying check functions but that is an implementation detail, not a change to doctor's observable behavior)

## Impact

- New: `packages/cli/src/commands/validate.ts`, registered in `cli.ts`
- New: `packages/cli/src/lib/validate.ts` (or split modules) — bet DoD check, spec-delta merge-preview, drift check, cross-bet conflict check; the merge-preview and conflict-check logic should be extracted from the prose currently embedded in `archiveSkill()` (`packages/cli/src/lib/install-agent.ts`) into shared TypeScript so both `validate` and `/oprim:archive` describe (and, where possible, execute) the same logic rather than maintaining two descriptions of the fold/conflict algorithm
- `packages/cli/src/lib/integrity.ts` — `checkSequenceIntegrity`/`checkSkillVersionDrift` reused (not modified) by the new command
- No change to `oprim/config.yaml` schema, `oprim/sequence.yaml` format, or the bet/PDR/spec/review authoring commands themselves
- No change to `/oprim:archive`'s own behavior or prompts (still interactive, still un-gated by `validate` unless a project's CI chooses to run `oprim validate --strict` before allowing an archive-related merge)
