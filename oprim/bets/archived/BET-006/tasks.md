## 1. Detection

- [x] 1.1 Add `AGENTS.md` check to `detectAvailableAgents()` in `detect.ts` — return `'codex'` when present
- [x] 1.2 Add `GEMINI.md` check to `detectAvailableAgents()` in `detect.ts` — return `'gemini'` when present
- [x] 1.3 Add unit tests in `detect.test.ts` for Codex detection (AGENTS.md present / absent)
- [x] 1.4 Add unit tests in `detect.test.ts` for Gemini CLI detection (GEMINI.md present / absent)

## 2. Type and constants

- [x] 2.1 Expand `Agent` type in `install-agent.ts` from `'claude' | 'cursor'` to include `'codex' | 'gemini'`
- [x] 2.2 Add `'codex'` and `'gemini'` to `SUPPORTED_AGENTS` readonly array

## 3. Init prompt

- [x] 3.1 Add Codex choice to `promptAgentSelection()` checkbox list, auto-checked when `'codex'` is in detected agents
- [x] 3.2 Add Gemini CLI choice to `promptAgentSelection()` checkbox list, auto-checked when `'gemini'` is in detected agents

## 4. Codex content

- [x] 4.1 Write `codexInstructions()` function in `install-agent.ts` that returns the full `AGENTS.md` oprim section (all five workflows inlined: bet, criteria, pdr, review, archive), wrapped with `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters
- [x] 4.2 Write `writeAgentInstructionFile(filePath, section)` helper that appends the section on first install and replaces the delimited block on re-runs (idempotent)

## 5. Gemini content

- [x] 5.1 Write `geminiInstructions()` function in `install-agent.ts` that returns the full `GEMINI.md` oprim section (all five workflows inlined: bet, criteria, pdr, review, archive), wrapped with `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters
- [x] 5.2 Reuse `writeAgentInstructionFile()` helper for Gemini CLI installation (same mechanism, different target file)

## 6. Installation branches

- [x] 6.1 Add `codex` branch to `installAgentSkills()` — calls `writeAgentInstructionFile('AGENTS.md', codexInstructions())` and prints confirmation
- [x] 6.2 Add `gemini` branch to `installAgentSkills()` — calls `writeAgentInstructionFile('GEMINI.md', geminiInstructions())` and prints confirmation

## 7. Tests

- [x] 7.1 Add `install-agent.test.ts` tests for Codex installation: file created when absent, content appended when present, section replaced on re-run
- [x] 7.2 Add `install-agent.test.ts` tests for Gemini CLI installation: file created when absent, content appended when present, section replaced on re-run
- [x] 7.3 Add test for `promptAgentSelection()` auto-check behaviour when `detectAvailableAgents()` returns `['codex']` or `['gemini']`

## 8. Validation

- [x] 8.1 Run `npm test` in `packages/cli` — all existing and new tests pass
- [x] 8.2 Manually verify `oprim init` prompt lists all four agents (claude, cursor, codex, gemini)
- [x] 8.3 Manually verify `oprim init --agent codex` writes `AGENTS.md` with delimited oprim section
- [x] 8.4 Manually verify `oprim init --agent gemini` writes `GEMINI.md` with delimited oprim section
- [x] 8.5 Manually verify re-running `oprim update` replaces only the oprim section in an existing `AGENTS.md` or `GEMINI.md`
