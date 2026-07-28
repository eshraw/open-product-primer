## 1. oprim-spec: proposal/design/tasks generation

- [ ] 1.1 `packages/cli/src/workflows/spec-authoring.template.md` — before writing the spec delta, check whether `proposal.md`, `design.md`, and `tasks.md` already exist in the bet's directory
- [ ] 1.2 If none exist, draft `proposal.md` (why/what, sourced from `bet-decision.md`'s why-now and expected outcomes) before the spec delta step
- [ ] 1.3 If none exist, draft `design.md` (technical approach/trade-offs for the capability being specced)
- [ ] 1.4 If none exist, draft `tasks.md` using `## N. <heading>` / `- [ ] N.M <description>` checkbox groups, derived from the requirements/scenarios captured in this pass
- [ ] 1.5 On a second or later `oprim-spec` invocation for the same bet, skip steps 1.2–1.4 and only write/append the spec delta
- [ ] 1.6 Update the skill's `## Steps` numbering and the "Report what was created" step to mention the new artifacts on first-run

## 2. oprim:archive: tasks.md completion warning

- [ ] 2.1 `packages/cli/src/workflows/archive.template.md` (and `archive.inline.md`) — before the move step, check for `tasks.md` in the bet directory and count unchecked `- [ ]` items
- [ ] 2.2 If any unchecked items exist, display a warning with the count and prompt for confirmation before proceeding (mirroring the existing "referenced by other active bets" warning step)
- [ ] 2.3 If `tasks.md` doesn't exist or has zero unchecked items, proceed without the warning

## 3. Documentation and skill-drift

- [ ] 3.1 Confirm `oprim doctor`'s skill-version-drift check picks up the updated `oprim-spec` and `oprim:archive` template content after `oprim update`
- [ ] 3.2 Update `CLAUDE.md` / README references to `oprim-spec`'s output, if any exist, to mention the new artifacts

## 4. Test updates

- [ ] 4.1 Add a test for `oprim-spec` generating all four artifacts on first invocation for a bet
- [ ] 4.2 Add a test for `oprim-spec` skipping proposal/design/tasks generation on a second invocation for the same bet
- [ ] 4.3 Add a test for `oprim:archive` warning on an incomplete `tasks.md` and proceeding cleanly on a complete one
- [ ] 4.4 `npm test` (in `packages/cli/`) passes
