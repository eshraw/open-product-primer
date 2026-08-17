# Decision: BET-043 Add Qwen Code agent support

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — product adoption is cited as needing Qwen Code support, but the volume of teams standardized on it specifically isn't independently confirmed yet
- **Usability risk**: Low — install path mirrors the existing Poolside (BET-040) pattern users already understand
- **Feasibility risk**: Low — of the four bets, this is the lowest-lift: Qwen Code's skill convention (`.qwen/skills/<name>/SKILL.md`) is the exact SKILL.md format oprim already generates for Claude Code, Cursor, and Poolside
- **Business viability risk**: Low — no revenue/legal/ops exposure; purely additive OSS tool support

## Why now
- Qwen Code (`QwenLM/qwen-code`) is a first-party open-source terminal coding agent from Alibaba with real adoption; teams using it can't run oprim because it isn't in `detectAvailableAgents()`/`install-agent.ts`
- Qwen Code's skill convention (`.qwen/skills/<name>/SKILL.md`) is the same SKILL.md format oprim already generates for Claude Code, Cursor, and Poolside — this closely mirrors the existing Poolside integration (BET-040), making it the most mechanically straightforward of the four bets

## Alternatives considered
- Bundle with Kimi CLI into one "SKILL.md-compatible agents" bet since both use the same file format — rejected to keep bet scope and kill-criteria independent per agent, matching the one-bet-per-agent precedent set by Codex, Gemini, and Poolside

## Expected outcomes
- Qwen Code added as a supported agent type, detected via `.qwen/`; `oprim init`/`oprim update` install oprim skills to `.qwen/skills/`
- Qwen added to `detectAvailableAgents()`, the interactive `oprim init` agent-selection prompt, and `install-agent.ts` orchestration

## Kill criteria / rollback trigger
- Defer if Qwen Code's skill-discovery behavior changes to no longer auto-watch project skill directories (per current docs, it does watch and auto-refresh)

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
