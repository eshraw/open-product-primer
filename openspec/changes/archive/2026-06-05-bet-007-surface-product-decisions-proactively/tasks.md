## 1. Add oprim:context skill constant to install-agent.ts

- [x] 1.1 Add `OPRIM_CONTEXT_SKILL` string constant to `packages/cli/src/lib/install-agent.ts` with the full skill content: scan `oprim/decisions/`, extract keywords from conversation, surface matching PDRs as compact list, exit silently if no matches
- [x] 1.2 Add `OPRIM_CONTEXT_SKILL_STEP` string constant — the Step 0 block that each oprim/openspec skill will prepend when opted in (e.g., "**Step 0**: Invoke `oprim:context` to check for relevant product decisions")

## 2. Add opt-in prompt to oprim init

- [x] 2.1 In `packages/cli/src/commands/init.ts`, add a prompt after agent selection: "Enable proactive PDR surfacing in skills? (y/N)" — default N
- [x] 2.2 Pass the user's answer as a `pdrSurfacing: boolean` option through to the install-agent call

## 3. Add opt-in prompt to oprim update

- [x] 3.1 In `packages/cli/src/commands/update.ts`, add the same prompt: "Enable proactive PDR surfacing in skills? (y/N)" — default N
- [x] 3.2 Pass `pdrSurfacing: boolean` through to the install-agent call

## 4. Make skill installation conditional in install-agent.ts

- [x] 4.1 Update the Claude skill installation block in `install-agent.ts` to accept a `pdrSurfacing` flag
- [x] 4.2 When `pdrSurfacing: true`: write `oprim:context` skill to `.claude/skills/oprim:context/SKILL.md`; when `false`: skip (or remove if it exists)
- [x] 4.3 When `pdrSurfacing: true`: prepend `OPRIM_CONTEXT_SKILL_STEP` to each oprim skill string before writing (`oprim-bet`, `oprim-pdr`, `oprim-review`, `oprim-criteria`, `oprim-archive`)
- [x] 4.4 When `pdrSurfacing: true`: prepend `OPRIM_CONTEXT_SKILL_STEP` to each openspec skill string before writing (`openspec-propose`, `openspec-apply-change`, `openspec-explore`, `openspec-archive-change`)
- [x] 4.5 When `pdrSurfacing: false`: install all skills without any `oprim:context` step (existing behavior, no change)

## 5. Verify opt-in path

- [x] 5.1 Run `oprim init` or `oprim update`, answer "y" to the PDR surfacing prompt, then confirm `.claude/skills/oprim:context/SKILL.md` exists
- [x] 5.2 Confirm each oprim and openspec skill file under `.claude/skills/` begins with the `oprim:context` invocation step after opting in
- [x] 5.3 Manually invoke `oprim-bet` with a non-empty `oprim/decisions/` (opted in) and confirm matching PDRs are displayed before the title prompt
- [x] 5.4 Manually invoke `openspec-propose` with a non-empty `oprim/decisions/` (opted in) and confirm matching PDRs are displayed before proposal questions begin
- [x] 5.5 Manually invoke any oprim skill with an empty `oprim/decisions/` (opted in) and confirm no output is produced by `oprim:context`

## 6. Verify opt-out path

- [x] 6.1 Run `oprim init` or `oprim update`, answer "n" (or press Enter) at the PDR surfacing prompt, then confirm `.claude/skills/oprim:context/` does NOT exist
- [x] 6.2 Confirm no oprim or openspec skill file under `.claude/skills/` contains an `oprim:context` step — behavior identical to pre-feature baseline
