## 1. Type System & Detection

- [ ] 1.1 Add `'kimi'` to the `Agent` union type and `SUPPORTED_AGENTS` array in `lib/install-agent.ts`
- [ ] 1.2 Add `.kimi/` directory check to `detectAvailableAgents()` in `lib/detect.ts`

## 2. Agent Selection Prompt

- [ ] 2.1 Add Kimi CLI checkbox entry to `promptAgentSelection()` in `lib/install-agent.ts`, pre-checked when `detected.includes('kimi')`
- [ ] 2.2 Add `kimi` to the valid agent names list in the `--agent` flag validation in `commands/init.ts`, and update the `--agent` help text string

## 3. Skill Content

- [ ] 3.1 Add a `kimi: { skill: boolean }` field to `WorkflowSchema` in `workflow-schema.ts`, defaulting to `poolside.skill` when a schema declares no `kimi:` key (same default-mirroring pattern as `vibe`/`qwen`)
- [ ] 3.2 Reuse `POOLSIDE_SKILL_WORKFLOW_IDS` directly in the `kimi` install branch rather than declaring a duplicate identical array
- [ ] 3.3 Add a `kimiInstructions()` function in `lib/install-agent.ts` mirroring `poolsideInstructions()`, wrapped in `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters (via the shared `writeAgentInstructionFile()`)

## 4. Install Logic

- [ ] 4.1 Add a `kimi` case to `installAgentSkills()` in `lib/install-agent.ts` that: creates `.kimi/` if absent (log if newly created); separately ensures `.skills/` exists and writes skill files to `.skills/<name>/SKILL.md` (**not** `.kimi/skills/`) for each `POOLSIDE_SKILL_WORKFLOW_IDS` entry gated on `schema.kimi.skill` (plus `oprim-spec` when `framework === 'native'`); calls `writeAgentInstructionFile()` with `kimiInstructions()` to write `AGENTS.md`. Add a `KIMI_SKILLS` bundled-export constant mirroring `POOLSIDE_SKILLS`

## 5. Tests

- [ ] 5.1 Add Kimi detection tests to `__tests__/detect.test.ts`: with `.kimi/` present returns `['kimi']`; without it does not include `'kimi'`; extend the "all agents present" test to include `kimi`
- [ ] 5.2 Add Kimi install tests to `__tests__/install-agent.test.ts`: `.skills/` (not `.kimi/skills/`) created with the expected SKILL.md files; `AGENTS.md` written with an oprim section; `.kimi/` created when absent; re-run is idempotent; extend the oprim-spec-for-native-framework and fresh-install-renders-bundled-workflow tests to cover `kimi`
- [ ] 5.3 Add `workflow-schema.test.ts` coverage for the new `kimi` field: defaults to mirroring `poolside.skill` when a schema omits `kimi:`, and can be overridden independently
