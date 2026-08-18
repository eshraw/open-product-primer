# Decision: BET-048 Add DeepSeek Harness dsh skill install support
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-08-18
- Owner: Eshane
- Review date: 2026-09-14

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — product adoption need is confirmed, but dsh's own adoption is unconfirmed (5-day-old developer preview, no default interactive terminal mode yet)
- **Usability risk**: Low — reuses the exact SKILL.md format and Kimi/Vibe/Qwen `install-agent.ts` pattern already proven in this codebase
- **Feasibility risk**: Low — dsh's skill discovery convention (`.dsh/skills/<name>/SKILL.md`, project root via nearest `.git`) is a documented, direct match for oprim's existing skill-writing code path; no new template format needed
- **Business viability risk**: Low — no revenue/legal/ops exposure, MIT-licensed, npm package published from an official `deepseek-ai` org account with a verified maintainer

## Why now
- BET-045's spike confirmed `deepseek-ai/deepseek-harness` (`dsh`) as the DeepSeek-blessed harness, ending the "no first-party CLI" ambiguity that had deferred implementation
- Its skill-discovery convention (`docs/subsystems/skills.md`) is architecturally identical to the SKILL.md pattern oprim already writes for Claude/Cursor/Kimi — no new rendering logic needed, only a new `detectAvailableAgents()` entry and an `install-agent.ts` target directory (`.dsh/skills/`)
- Detection signal: presence of a `.dsh/` directory, following the same convention as `.kimi/`, `.qwen/`, `.vibe/`

## Alternatives considered
- Commit to a community tool (Deep Code, DeepSeek-TUI, deepseekcode) — superseded now that DeepSeek shipped its own official harness
- Bundle this with the deeper native-plugin integration (BET-049) — rejected; that's a heavier, profile-scoped distribution model that doesn't fit the project-local file-drop pattern this bet uses, and would block shipping the low-risk parity work

## Expected outcomes
- `oprim init`/`oprim update` detect `.dsh/` and write skills to `.dsh/skills/<name>/SKILL.md`, matching the Kimi/Vibe/Qwen skills+instruction-file pattern
- `detectAvailableAgents()` gains a `dsh` entry
- Metric: dsh added to the supported-agent list (README, `detect.ts`) with test coverage parity with the other seven agents, within the review window

## Kill criteria / rollback trigger
- If dsh's `.dsh/skills` convention changes incompatibly before ship (developer-preview breaking-change risk), pause and re-verify against `docs/subsystems/skills.md` before merging
- If no confirmed DeepSeek-CLI-using teammate/user surfaces by the review date, deprioritize behind other backlog bets

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
- Origin: BET-045 (Evaluate DeepSeek coding-agent harness options)
- Reference: https://github.com/deepseek-ai/deepseek-harness, docs/subsystems/skills.md
