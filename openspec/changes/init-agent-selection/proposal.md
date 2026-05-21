## Why

`oprim init` currently scaffolds the `primer/` workspace and then tells the user to run `oprim update` separately to install assistant skills. `oprim update` silently auto-detects `.claude/` and `.cursor/` directories and installs for whichever are present — there is no way to choose. Users who want to install only for one agent, or who want to install before the agent's config directory exists, have no path to do so. Adding an interactive agent selection step to `init` (matching the UX pattern OpenSpec uses) closes this gap and makes the full setup happen in a single command.

## What Changes

- **Modified**: `oprim init` gains an interactive agent-selection prompt — user picks which AI tools to install `/oprim:*` skills for (Claude Code, Cursor, both, or none)
- **Modified**: The selected agents are written to `primer/config.yaml` under `agents:` so `oprim update` and `oprim doctor` can reference the explicit selection instead of re-detecting
- **Modified**: `oprim update` respects `agents:` from `primer/config.yaml` when present, falling back to directory detection when the field is absent (backwards compatibility)
- **Modified**: `oprim doctor` reports the configured agents and flags if a configured agent's config directory is missing
- **New**: `--agent` flag on `oprim init` for non-interactive use (CI, scripting): `oprim init --agent claude --agent cursor`

## Capabilities

### New Capabilities
- `init-agent-selection`: Interactive and flag-driven agent selection during `oprim init`, with selection persisted to `primer/config.yaml`

### Modified Capabilities
- `project-installation`: `oprim init` now installs skills as part of setup; `oprim update` reads config-declared agents; `oprim doctor` validates agent config
- `sequencing-board`: No changes

## Impact

- `packages/cli/src/commands/init.ts` — add agent selection prompt and skill installation step
- `packages/cli/src/commands/update.ts` — read `agents:` from `primer/config.yaml` when present
- `packages/cli/src/commands/doctor.ts` — add agent config validation check
- `packages/cli/src/lib/templates.ts` — add `agents:` field to `configTemplate`
- `primer/config.yaml` schema — new optional `agents:` list field (`claude`, `cursor`)
- No breaking changes; existing repos without `agents:` in config continue to work via directory detection
