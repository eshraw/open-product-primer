## Why

Teams using Poolside AI (`pool` CLI) cannot use oprim because `oprim init` / `oprim update` has no support for it. Poolside has a native skill system (same SKILL.md format as Claude Code and Cursor) that makes first-class support straightforward.

## What Changes

- Add `poolside` as a fifth supported agent type alongside `claude`, `cursor`, `codex`, and `gemini`
- Detect Poolside presence via `.poolside/` directory at project root
- `oprim init` / `oprim update` installs oprim skills to `.poolside/skills/` (native Poolside skill path) and writes an oprim workflow section to `AGENTS.md` (Poolside also reads `AGENTS.md` for project-level instructions)
- `.poolside/` directory is created during install if it does not yet exist

## Capabilities

### New Capabilities

- `poolside-agent-support`: Detection, skill installation, and AGENTS.md section generation for the Poolside AI agent

### Modified Capabilities

- `init-agent-selection`: Poolside is added to the agent selection prompt and auto-detection logic

## Impact

- `packages/cli/src/lib/detect.ts` — new detection check
- `packages/cli/src/lib/install-agent.ts` — new agent type, skill content constants, install case
- `packages/cli/src/commands/init.ts` — updated agent selection prompt
- `packages/cli/src/__tests__/detect.test.ts` — new detection tests
- `packages/cli/src/__tests__/install-agent.test.ts` — new install tests
