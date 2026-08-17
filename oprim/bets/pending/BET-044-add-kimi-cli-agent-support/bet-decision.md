# Decision: BET-044 Add Kimi CLI agent support

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — product adoption is cited as needing Kimi CLI support, but the volume of teams standardized on it specifically isn't independently confirmed yet
- **Usability risk**: Low — install path mirrors the existing Poolside (BET-040) pattern users already understand
- **Feasibility risk**: Low-Medium — Kimi CLI is a documented, first-party CLI (`MoonshotAI/kimi-cli`), but its skill-loading path (project `.skills/`, not `.kimi/skills/`) is a genuine deviation from the pattern the other three bets follow, so `install-agent.ts` needs a distinct branch rather than a copy-paste of the Poolside/Qwen path
- **Business viability risk**: Low — no revenue/legal/ops exposure; purely additive OSS tool support

## Why now
- Kimi CLI (`MoonshotAI/kimi-cli`) is Moonshot AI's first-party terminal coding agent (powered by K2.7) with SKILL.md support; teams standardized on it can't use oprim today
- Kimi CLI's skill convention differs from the others: skills load from a project's `.skills/` directory rather than a `.kimi/`-scoped path, so oprim's install path needs to target `.skills/` specifically rather than mirroring the `.<agent>/skills/` pattern used for Qwen/Poolside

## Alternatives considered
- Install into `.kimi/skills/` for path-naming consistency with the `.<agent>/` pattern used elsewhere — rejected because it wouldn't match Kimi CLI's actual discovery path (`.skills/`) per `MoonshotAI/kimi-cli` docs, and skills placed there would silently fail to load

## Expected outcomes
- Kimi CLI added as a supported agent type, detected via `.kimi/`; `oprim init`/`oprim update` install oprim skills to `.skills/` (per Kimi's actual discovery convention) and/or write an oprim workflow block into `AGENTS.md`, since the upstream `kimi-cli` repo ships its own `AGENTS.md`, suggesting Kimi also reads it
- Kimi added to `detectAvailableAgents()`, the interactive `oprim init` agent-selection prompt, and `install-agent.ts` orchestration

## Kill criteria / rollback trigger
- Defer if implementation reveals `.skills/` is a shared/ambiguous convention that would collide with another installed tool's skill directory in the same repo — reassess the install path before shipping rather than shipping a collision risk

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
