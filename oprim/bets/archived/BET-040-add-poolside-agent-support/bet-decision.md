# Decision: BET-040 Add Poolside AI agent support

> Reconstructed retroactively from `openspec/changes/archive/2026-06-29-add-poolside-ai-support/` during the native-specs migration (2026-07-29) — this predates oprim's bet-decision workflow, so the fields below are inferred from the original proposal rather than authored live.

## Status
- Decision: Build now
- Date: 2026-06-29
- Owner: Eshane
- Review date: 2026-06-29

## Why now
- Teams using Poolside AI (`pool` CLI) couldn't use oprim because `oprim init`/`oprim update` had no support for it
- Poolside has a native skill system (same `SKILL.md` format as Claude Code and Cursor), making first-class support straightforward

## Alternatives considered
- Not recorded in the original proposal.

## Expected outcomes
- Poolside added as a fifth supported agent type (detected via `.poolside/`); `oprim init`/`oprim update` install oprim skills to `.poolside/skills/` and write an oprim workflow section to `AGENTS.md`; Poolside added to the agent-selection prompt and auto-detection logic

## Kill criteria / rollback trigger
- Not recorded in the original proposal.

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/archive/2026-06-29-add-poolside-ai-support/`
