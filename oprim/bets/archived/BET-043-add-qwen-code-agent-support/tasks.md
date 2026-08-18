## 1. Type System & Detection

- [x] 1.1 Add `'qwen'` to the `Agent` union type and `SUPPORTED_AGENTS` array in `lib/install-agent.ts`
- [x] 1.2 Add `.qwen/` directory check to `detectAvailableAgents()` in `lib/detect.ts`

## 2. Agent Selection Prompt

- [x] 2.1 Add Qwen Code checkbox entry to `promptAgentSelection()` in `lib/install-agent.ts`, pre-checked when `detected.includes('qwen')`
- [x] 2.2 Add `qwen` to the valid agent names list in the `--agent` flag validation in `commands/init.ts`, and update the `--agent` help text string

## 3. Skill Content

- [x] 3.1 Add a `qwen: { skill: boolean }` field to `WorkflowSchema` in `workflow-schema.ts`, defaulting to `poolside.skill` when a schema declares no `qwen:` key (same default-mirroring pattern as `vibe`)
- [x] 3.2 Reuse `POOLSIDE_SKILL_WORKFLOW_IDS` directly in the `qwen` install branch rather than declaring a duplicate identical array
- [x] 3.3 Add a `qwenInstructions()` function in `lib/install-agent.ts` mirroring `poolsideInstructions()`/`vibeInstructions()`, wrapped in `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters (via the shared `writeAgentInstructionFile()`)

## 4. Install Logic

- [x] 4.1 Add a `qwen` case to `installAgentSkills()` in `lib/install-agent.ts` that creates `.qwen/` if absent (log if newly created), writes skill files to `.qwen/skills/<name>/SKILL.md` for each `POOLSIDE_SKILL_WORKFLOW_IDS` entry gated on `schema.qwen.skill` (plus `oprim-spec` when `framework === 'native'`, matching the Poolside/Vibe branch), and calls `writeAgentInstructionFile()` with `qwenInstructions()` to write `AGENTS.md`. Add a `QWEN_SKILLS` bundled-export constant mirroring `POOLSIDE_SKILLS`/`VIBE_SKILLS`

## 5. Tests

- [x] 5.1 Add Qwen detection tests to `__tests__/detect.test.ts`: with `.qwen/` present returns `['qwen']`; without it does not include `'qwen'`; extend the "all agents present" test to seven agents
- [x] 5.2 Add Qwen install tests to `__tests__/install-agent.test.ts`: `.qwen/skills/` created with the expected SKILL.md files; `AGENTS.md` written with an oprim section; `.qwen/` created when absent; re-run is idempotent; extend the oprim-spec-for-native-framework and fresh-install-renders-bundled-workflow tests to cover `qwen`
- [x] 5.3 Add `workflow-schema.test.ts` coverage for the new `qwen` field: defaults to mirroring `poolside.skill` when a schema omits `qwen:`, and can be overridden independently
