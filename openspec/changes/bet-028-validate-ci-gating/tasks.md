## 1. Shared spec-delta logic extraction

- [x] 1.1 Create `packages/cli/src/lib/spec-delta.ts` with `foldDelta(currentTruth, delta)`: extract the ADDED-append / MODIFIED-replace-or-note / REMOVED-delete-or-note algorithm currently described only in `archiveSkill()`'s Step 4 prose (`packages/cli/src/lib/install-agent.ts`)
- [x] 1.2 Add `parseRequirementHeaders(deltaContent, section)` helper to extract `### Requirement:` headers from a `## ADDED/MODIFIED/REMOVED Requirements` section
- [x] 1.3 Add `findCrossBetConflicts(betsDir)` to `lib/spec-delta.ts`: extract the overlap-detection algorithm currently described only in `archiveSkill()`'s Step 3 prose, generalized to scan all active bets (not just the one being archived) pairwise
- [x] 1.4 Unit test `foldDelta()` against the scenarios in `specs/spec-delta-preview/spec.md` (existing current truth, no current truth, ADDED/MODIFIED/REMOVED)
- [x] 1.5 Unit test `findCrossBetConflicts()` against the scenarios in `specs/cross-bet-conflict-detection/spec.md`

## 2. Bet definition-of-done check

- [x] 2.1 Add `checkBetDefinitionOfDone(projectRoot, checks)` to `lib/integrity.ts` (or a new `lib/validate-checks.ts`): for each non-archived bet directory, parse `bet-decision.md`'s `## Links` section, detect a non-placeholder `OpenSpec change:` entry, and check for a sibling `criteria.yaml`
- [x] 2.2 Unit test against `specs/bet-definition-of-done/spec.md` scenarios (promoted+missing, promoted+present, un-promoted)

## 3. Delta drift check

- [x] 3.1 Add `checkSpecDeltaDrift(projectRoot, checks)`: for each active bet's delta, use `parseRequirementHeaders` to pull MODIFIED/REMOVED headers and check each against `oprim/specs/<capability>/spec.md` headers (whitespace-insensitive match)
- [x] 3.2 Unit test against `specs/spec-delta-drift-detection/spec.md` scenarios

## 4. `oprim validate` command

- [x] 4.1 Create `packages/cli/src/commands/validate.ts`: base command that runs `checkSequenceIntegrity`, `checkSkillVersionDrift`, `checkBetDefinitionOfDone`, `checkSpecDeltaDrift`, and the cross-bet overlap check from `findCrossBetConflicts`, into one `Check[]`
- [x] 4.2 Implement human-readable report output (reuse the doctor's icon/format convention) as the default output mode
- [x] 4.3 Implement `--json`: print a single JSON document `{ checks: [...] }` and suppress the human-readable report
- [x] 4.4 Implement `--strict`: exit non-zero if any check fails, not only `required` ones
- [x] 4.5 Implement default (non-strict) exit-code behavior: exit non-zero only if a `required` check fails
- [x] 4.6 Implement `--diff <BET-ID>`: resolve the bet directory (reuse the same slug-matching logic `/oprim:archive` uses), call `foldDelta()` per capability under its `specs/`, and print the computed result without writing files; report "no spec deltas" or "bet not found" as appropriate
- [x] 4.7 Register `validateCommand()` in `cli.ts`
- [x] 4.8 Unit test `validate-command`'s exit codes and `--json`/`--strict` behavior against `specs/validate-command/spec.md` scenarios

## 5. Verification

- [x] 5.1 Run `oprim validate` against this repository's own `oprim/` workspace and confirm the report is sensible (no false positives against real bets/sequence.yaml)
- [x] 5.2 Run `npm test` in `packages/cli/` and confirm the full suite passes
- [x] 5.3 Confirm `oprim doctor`'s existing output and exit behavior (always 0, informational) is unchanged by the introduction of `lib/spec-delta.ts` and the new check functions

## 6. Documentation

- [x] 6.1 Add `oprim validate` to `CLAUDE.md`'s Commands section (or wherever CLI subcommands are documented) alongside `init`/`update`/`doctor`
- [x] 6.2 Document `--json`/`--strict`/`--diff` flags and a suggested CI usage snippet (e.g. `oprim validate --strict --json` in a GitHub Actions step)
