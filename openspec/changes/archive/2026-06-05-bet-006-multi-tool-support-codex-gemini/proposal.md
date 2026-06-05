## Context

- Bet: BET-006 (`oprim/bets/BET-006/bet-decision.md`)

## Why

The product primer methodology is tool-agnostic, but the implementation locks users to Claude Code and Cursor. As the agentic tool landscape fragments, teams reach for Codex (OpenAI) and Gemini CLI (Google) alongside or instead of Claude — oprim should install and work wherever the team works.

## What Changes

- `detect.ts`: `detectAvailableAgents()` detects Codex (`AGENTS.md` or `.codex/` present) and Gemini CLI (`GEMINI.md` or `.gemini/` present) in addition to Claude Code and Cursor
- `install-agent.ts`: `Agent` type expands from `'claude' | 'cursor'` to include `'codex' | 'gemini'`; `SUPPORTED_AGENTS` updated accordingly
- `install-agent.ts`: `promptAgentSelection()` lists Codex and Gemini CLI as selectable targets, auto-checked when detected
- `install-agent.ts`: `installAgentSkills()` gains `codex` and `gemini` branches that write oprim workflow instructions to each tool's canonical location
- Codex installation writes oprim workflow instructions to `AGENTS.md` (appended section) and optional tool config files under `.codex/`
- Gemini CLI installation writes oprim workflow instructions to `GEMINI.md` (appended section) and optional skill files under `.gemini/`
- `oprim/config.yaml` `agents:` field accepts `codex` and `gemini` identifiers

## Capabilities

### New Capabilities
- `codex-agent-support`: oprim installs workflow instructions for Codex by appending to `AGENTS.md` and writing tool definitions under `.codex/`
- `gemini-agent-support`: oprim installs workflow instructions for Gemini CLI by appending to `GEMINI.md` and writing skill files under `.gemini/`

### Modified Capabilities
- `init-agent-selection`: selection prompt and auto-detection now include Codex and Gemini CLI alongside Claude Code and Cursor; `--agent codex` and `--agent gemini` become valid flag values

## Impact

- `packages/cli/src/lib/detect.ts` — `detectAvailableAgents()` expanded
- `packages/cli/src/lib/install-agent.ts` — `Agent` type, `SUPPORTED_AGENTS`, `promptAgentSelection()`, `installAgentSkills()`, new `CODEX_SKILLS`, `GEMINI_SKILLS` content blocks
- `packages/cli/src/__tests__/install-agent.test.ts` — tests for new agent branches
- `packages/cli/src/__tests__/detect.test.ts` — detection tests for Codex/Gemini indicators
- No changes to `oprim/` data artifacts or YAML schemas
