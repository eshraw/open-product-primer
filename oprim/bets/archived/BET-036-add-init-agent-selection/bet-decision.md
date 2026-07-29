# Decision: BET-036 Add interactive agent selection to oprim init

> Reconstructed retroactively from `openspec/changes/archive/2026-05-22-init-agent-selection/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-05-22
- Owner: Eshane
- Review date: 2026-05-22

## Why now
- `oprim init` scaffolded the `primer/` workspace and told the user to separately run `oprim update`, which silently auto-detected `.claude/`/`.cursor/` with no way to choose
- Users who wanted only one agent installed, or wanted to install before the agent's config directory existed, had no path to do so

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- `oprim init` gains an interactive agent-selection prompt (matching OpenSpec's UX pattern), persists the selection to `primer/config.yaml` under `agents:`, and `oprim update`/`oprim doctor` read that explicit selection instead of re-detecting; a `--agent` flag supports non-interactive/CI use

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-05-22-init-agent-selection/`
