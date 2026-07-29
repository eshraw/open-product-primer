## 1. Type System & Detection

- [x] 1.1 Add `'poolside'` to the `Agent` union type and `SUPPORTED_AGENTS` array in `lib/install-agent.ts`
- [x] 1.2 Add `.poolside/` directory check to `detectAvailableAgents()` in `lib/detect.ts`

## 2. Agent Selection Prompt

- [x] 2.1 Add Poolside checkbox entry to `promptAgentSelection()` in `lib/install-agent.ts`, pre-checked when `detected.includes('poolside')`
- [x] 2.2 Add `poolside` to the valid agent names list in the `--agent` flag validation in `commands/init.ts`

## 3. Skill Content

- [x] 3.1 Add `POOLSIDE_SKILLS` constant in `lib/install-agent.ts` with six SKILL.md entries (pdr, bet, criteria, review, archive, sequence) adapted from `CURSOR_SKILLS` with Poolside-specific invocation wording (`/skills` command, `.poolside/skills/` path)
- [x] 3.2 Add `poolsideInstructions()` function in `lib/install-agent.ts` mirroring `codexInstructions()` structure, with Poolside-specific wording and wrapped in `<!-- oprim:start -->` / `<!-- oprim:end -->` delimiters

## 4. Install Logic

- [x] 4.1 Add `poolside` case to `installAgentSkills()` in `lib/install-agent.ts` that creates `.poolside/` if absent (log if newly created), writes `POOLSIDE_SKILLS` entries to `.poolside/skills/<name>/SKILL.md`, and calls `writeAgentInstructionFile()` with `poolsideInstructions()` to write `AGENTS.md`

## 5. Tests

- [x] 5.1 Add Poolside detection tests to `__tests__/detect.test.ts`: with `.poolside/` present returns `['poolside']`; without it does not include `'poolside'`
- [x] 5.2 Add Poolside install tests to `__tests__/install-agent.test.ts`: `.poolside/skills/` created with six SKILL.md files; `AGENTS.md` written with oprim section; `.poolside/` created when absent; re-run is idempotent
