## 1. Sequence Integrity Checks

- [x] 1.1 Create `packages/cli/src/lib/integrity.ts` with `checkSequenceIntegrity(projectRoot, checks)` function
- [x] 1.2 Parse `oprim/sequence.yaml` with `js-yaml`; push a warning check and return early on malformed YAML
- [x] 1.3 Collect all bet IDs from all lanes (now, next, later, backlog) into a Set
- [x] 1.4 Check `now:` count against `wip_limits.now`; push warning check if exceeded
- [x] 1.5 Iterate all entries and check each `blocked_by` ID against the known-ID Set; push warning per dangling reference
- [x] 1.6 Iterate all entries and check each `unlocks` ID against the known-ID Set; push warning per dangling reference

## 2. Skill Version Drift Checks

- [x] 2.1 Add `checkSkillVersionDrift(projectRoot, checks)` function to `lib/integrity.ts`
- [x] 2.2 Return early if `.claude/skills/` does not exist
- [x] 2.3 Import `CLAUDE_SKILLS` from `install-agent.ts`; for each key, check if the installed `SKILL.md` exists and read it
- [x] 2.4 Strip the Step 0 PDR-surfacing block from the installed content using the existing `removeContextStep` helper before comparing
- [x] 2.5 Compare stripped installed content against `CLAUDE_SKILLS[name]`; push a non-required warning check per mismatch

## 3. Wire into Doctor Command

- [x] 3.1 Import and call `checkSequenceIntegrity` from `commands/doctor.ts`
- [x] 3.2 Import and call `checkSkillVersionDrift` from `commands/doctor.ts`

## 4. Tests

- [x] 4.1 Add tests for WIP limit exceeded / not exceeded
- [x] 4.2 Add tests for dangling `blocked_by` reference
- [x] 4.3 Add tests for dangling `unlocks` reference
- [x] 4.4 Add test for malformed `sequence.yaml` (skips checks gracefully)
- [x] 4.5 Add test for skill drift detected (mismatch)
- [x] 4.6 Add test for skill drift not triggered (content matches)
- [x] 4.7 Add test for PDR-surfacing prefix stripped before comparison
- [x] 4.8 Add test for skill check skipped when `.claude/skills/` absent
