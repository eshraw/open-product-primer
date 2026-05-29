## Why

Bets made without surfaced discovery context tend to have weaker rationale and harder kill criteria — the decision record captures the conclusion but not the research behind it. Adding a structured `discovery.md` per bet collocates the research with the decision while keeping `bet-decision.md` clean.

## What Changes

- **Added**: `primer/bets/BET-NNN/discovery.md` — a structured discovery artifact capturing user research, problem validation, competitive context, and open questions
- **Modified**: `oprim bet` skill — after creating `bet-decision.md`, prompts the user to optionally scaffold a `discovery.md` in the same directory
- **Modified**: `oprim init` — writes a `discovery.md` template to `primer/templates/`
- **Modified**: `oprim doctor` — optional check: warns if a bet directory has a `bet-decision.md` but no `discovery.md` (non-blocking)

## Capabilities

### New Capabilities
- `bet-discovery`: The `discovery.md` artifact structure, creation scenarios, and its relationship to `bet-decision.md`

### Modified Capabilities
- `bet-authoring`: `/oprim:bet` skill now prompts for optional discovery scaffolding after creating the bet decision

## Impact

- `packages/cli/src/lib/install-agent.ts` — `betSkill()` updated to prompt for discovery after bet creation
- `packages/cli/src/lib/templates.ts` — new `discoveryTemplate` export
- `packages/cli/src/commands/init.ts` — writes `primer/templates/discovery.md` from template
- `packages/cli/src/commands/doctor.ts` — optional discovery check per bet directory

## Context

- Bet: `primer/bets/BET-001/bet-decision.md`
- Decision date: 2026-05-27
- Owner: Eshane
