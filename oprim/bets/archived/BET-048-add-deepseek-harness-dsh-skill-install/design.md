# Design: deepseek-harness-agent-support

## Approach
Add DeepSeek Harness (`dsh`) as an eighth supported agent, following the exact code path already proven for Kimi CLI, Mistral Vibe, and Qwen Code:

1. **Detection** (`lib/detect.ts`) — add a `.dsh/` directory check to `detectAvailableAgents()`, returning `'dsh'` when present. Same shape as the existing `.kimi/`/`.vibe/`/`.qwen/` checks.
2. **Skill install** (`lib/install-agent.ts`) — add a `dsh` target that writes `SKILL.md` files to `.dsh/skills/<name>/SKILL.md` for the standard workflow set (pdr, bet, note, criteria, review, archive, sequence), reusing the same Agent Skills renderer already used for Poolside/Vibe/Qwen.
3. **Instruction file** — reuse the shared `AGENTS.md` dual-install path (same delimiter-wrapped block Codex/Poolside/Vibe/Qwen write), rather than inventing a dsh-specific instruction file.
4. **Docs/tests** — add `dsh` to the README's supported-agent list and add `detect.ts`/`install-agent.ts` test coverage mirroring the Kimi/Vibe/Qwen tests.

## Key decisions
- **Skills directory is project-root `.dsh/skills/`, not split-path like Kimi.** dsh's documented skill-discovery convention (`docs/subsystems/skills.md`) reads skills directly from `.dsh/skills/<name>/SKILL.md`, unlike Kimi CLI which discovers skills from a project-root `.skills/` directory despite being detected via `.kimi/`. No split-path special-casing is needed for dsh.
- **AGENTS.md, not a new instruction file.** dsh has no documented separate instruction-file convention distinct from AGENTS.md-style files; reusing the existing shared block avoids introducing a new file format for one agent.

## Alternatives considered
- Bundle with BET-049 (native dsh plugin) — rejected in the bet decision; that's a heavier, profile-scoped distribution model and would block shipping this low-risk parity work.

## Risks
- dsh is a 5-day-old developer preview; its `.dsh/skills` convention could change incompatibly before this ships. Re-verify against `docs/subsystems/skills.md` before merging if that risk materializes (per the bet's kill criteria).
