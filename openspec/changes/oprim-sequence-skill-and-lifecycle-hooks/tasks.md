## 1. oprim-sequence skill

- [ ] 1.1 Add `oprimSequenceSkill` string constant to `install-agent.ts` with triage mode steps: read `sequence.yaml`, compute WIP utilization, find unblocked Next bets, find blocked Now bets, surface ranked specific suggestions
- [ ] 1.2 Extend skill to support seeded mode: accept pre-seeded context string, skip full triage, jump to targeted suggestion for that context, fall back to triage if no relevant move found
- [ ] 1.3 Add move validation logic to skill: check WIP limits, blocker resolution, PDR preconditions before executing
- [ ] 1.4 Add YAML diff preview and confirmation step to skill before writing `sequence.yaml`
- [ ] 1.5 Write skill string to `.claude/skills/oprim-sequence/SKILL.md` in `installClaudeSkills()`

## 2. sequence.md command refactor

- [ ] 2.1 Replace inline steps in `sequence.md` command string with a one-liner: "invoke the oprim-sequence skill" — matching the pattern in `archive.md`
- [ ] 2.2 Verify the refactored command writes correctly in `installClaudeCommands()`

## 3. on-prompt-submit.sh hook extensions

- [ ] 3.1 Add detection for `/oprim:bet` invocation — write `.sequence-nudge` with content `"bet-created"` when detected
- [ ] 3.2 Add detection for `/oprim:promote` invocation — write `.sequence-nudge` with content `"bet-promoted"` when detected
- [ ] 3.3 Ensure new detections do not interfere with existing `/opsx:archive` detection logic

## 4. on-stop.sh hook extensions

- [ ] 4.1 Add `.sequence-nudge` flag read after existing archive co-archival block
- [ ] 4.2 Output contextual nudge message based on flag content (`"bet-created"` or `"bet-promoted"`)
- [ ] 4.3 After archive co-archival resolves, read `sequence.yaml` to check if Now lane is below WIP limit — if so, output open-slot nudge
- [ ] 4.4 Delete `.sequence-nudge` file after nudge is surfaced

## 5. install-agent.ts wiring

- [ ] 5.1 Confirm `installClaudeSkills()` includes `oprim-sequence` skill in the skills written for Claude agent
- [ ] 5.2 Confirm updated hook strings for `on-prompt-submit.sh` and `on-stop.sh` are sourced from `install-agent.ts` constants (not hardcoded elsewhere)

## 6. Tests

- [ ] 6.1 Add test: `oprim update` writes `oprim-sequence` skill file to `.claude/skills/oprim-sequence/SKILL.md`
- [ ] 6.2 Add test: `oprim update` writes simplified `sequence.md` command (contains skill invocation, not inline steps)
- [ ] 6.3 Add test: `on-prompt-submit.sh` detects `/oprim:bet` and writes `.sequence-nudge` with `"bet-created"`
- [ ] 6.4 Add test: `on-prompt-submit.sh` detects `/oprim:promote` and writes `.sequence-nudge` with `"bet-promoted"`
- [ ] 6.5 Add test: `on-stop.sh` reads `.sequence-nudge`, outputs nudge message, deletes flag
