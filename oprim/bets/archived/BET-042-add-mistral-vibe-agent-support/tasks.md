## 1. Type System & Detection

- [x] 1.1 Add `'vibe'` to the `Agent` union type and `SUPPORTED_AGENTS` array in `lib/install-agent.ts`
- [x] 1.2 Add `.vibe/` directory check to `detectAvailableAgents()` in `lib/detect.ts`

## 2. Agent Selection Prompt

- [x] 2.1 Add Vibe checkbox entry to `promptAgentSelection()` in `lib/install-agent.ts`, pre-checked when `detected.includes('vibe')`
- [x] 2.2 Add `vibe` to the valid agent names list in the `--agent` flag validation in `commands/init.ts` (validation already runs off `SUPPORTED_AGENTS`, updated in 1.1; also updated the `--agent` help text string)

## 3. Skill Content

- [x] 3.1 Add a `vibe: { skill: boolean }` field to `WorkflowSchema` in `workflow-schema.ts`. Made it optional, defaulting to `poolside.skill` when a schema declares no `vibe:` key — this keeps every existing bundled and forked `<id>.schema.yaml` (none declare `vibe:`) working unchanged while making Vibe mirror Poolside's skill set by default, reusing `renderSkillBody()`
- [x] 3.2 ~~Add `VIBE_SKILL_WORKFLOW_IDS` constant~~ — reused `POOLSIDE_SKILL_WORKFLOW_IDS` directly in the `vibe` install branch instead of declaring a duplicate identical array, since the two lists are defined to always match
- [x] 3.3 Add `vibeInstructions()` function in `lib/install-agent.ts` mirroring `poolsideInstructions()`, wrapped in `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters (via the shared `writeAgentInstructionFile()`)

## 4. Install Logic

- [x] 4.1 Add a `vibe` case to `installAgentSkills()` in `lib/install-agent.ts` that creates `.vibe/` if absent (log if newly created), writes skill files to `.vibe/skills/<name>/SKILL.md` for each `POOLSIDE_SKILL_WORKFLOW_IDS` entry gated on `schema.vibe.skill` (plus `oprim-spec` when `framework === 'native'`, matching the Poolside branch), and calls `writeAgentInstructionFile()` with `vibeInstructions()` to write `AGENTS.md`. Also added a `VIBE_SKILLS` bundled-export constant mirroring `POOLSIDE_SKILLS`

## 5. Tests

- [x] 5.1 Added Vibe detection tests to `__tests__/detect.test.ts`: with `.vibe/` present returns `['vibe']`; without it does not include `'vibe'`; extended the "all agents present" test to six agents
- [x] 5.2 Added Vibe install tests to `__tests__/install-agent.test.ts`: `.vibe/skills/` created with the expected SKILL.md files; `AGENTS.md` written with an oprim section; `.vibe/` created when absent; re-run is idempotent; extended the oprim-spec-for-native-framework and fresh-install-renders-bundled-workflow tests to cover `vibe`
- [x] 5.3 Added `workflow-schema.test.ts` coverage for the new `vibe` field: defaults to mirroring `poolside.skill` when a schema omits `vibe:`, and can be overridden independently

All 336 tests pass (`npm test`); `npm run build` succeeds.
