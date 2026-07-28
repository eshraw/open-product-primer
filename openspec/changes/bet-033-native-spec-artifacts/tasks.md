## 1. oprim-spec: design/tasks generation

- [x] 1.1 `packages/cli/src/workflows/spec-authoring.template.md` — before writing the spec delta, check whether `design.md` and `tasks.md` already exist in the bet's directory
- [x] 1.2 ~~If none exist, draft `proposal.md`~~ — dropped: redundant with `bet-decision.md`'s why-now/expected-outcomes, which `proposal.md` would have only restated
- [x] 1.3 If neither exists, draft `design.md` (technical approach/trade-offs for the capability being specced)
- [x] 1.4 If neither exists, draft `tasks.md` using `## N. <heading>` / `- [ ] N.M <description>` checkbox groups, derived from the requirements/scenarios captured in this pass
- [x] 1.5 On a second or later `oprim-spec` invocation for the same bet, skip steps 1.3–1.4 and only write/append the spec delta
- [x] 1.6 Update the skill's `## Steps` numbering and the "Report what was created" step to mention the new artifacts on first-run

## 2. oprim:archive: tasks.md completion warning

- [x] 2.1 `packages/cli/src/workflows/archive.template.md` (and `archive.inline.md`) — before the move step, check for `tasks.md` in the bet directory and count unchecked `- [ ]` items
- [x] 2.2 If any unchecked items exist, display a warning with the count and prompt for confirmation before proceeding (mirroring the existing "referenced by other active bets" warning step)
- [x] 2.3 If `tasks.md` doesn't exist or has zero unchecked items, proceed without the warning

## 3. Documentation and skill-drift

- [x] 3.1 Confirm `oprim doctor`'s skill-version-drift check picks up the updated `oprim-spec` and `oprim:archive` template content after `oprim update`
- [x] 3.2 Update `CLAUDE.md` / README references to `oprim-spec`'s output, if any exist, to mention the new artifacts

## 4. Test updates

- [x] 4.1 Add a test for `oprim-spec` generating all three artifacts (spec delta, design.md, tasks.md) on first invocation for a bet
- [x] 4.2 Add a test for `oprim-spec` skipping design/tasks generation on a second invocation for the same bet
- [x] 4.3 Add a test for `oprim:archive` warning on an incomplete `tasks.md` and proceeding cleanly on a complete one
- [x] 4.4 `npm test` (in `packages/cli/`) passes
