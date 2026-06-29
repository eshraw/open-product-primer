## Why

Viewing board state today requires either an LLM call (consuming tokens for a zero-reasoning read operation) or manually reading `oprim/sequence.yaml`. Beyond display, there is no tooling that guides a PM through sequencing decisions — specifically the discipline of using 2-way door bets to unrisk 1-way door bets, and surfacing unaddressed value / usability / feasibility / business viability risks before a high-commitment bet ships.

Board state and sequencing recommendations are product decisions rooted in the owner's vision — a CLI command renders them deterministically and cheaply, while an agent response introduces variability and token cost that are unjustified for a pure display-and-advise task.

## What Changes

- **Added**: `oprim ovw` CLI subcommand — reads `oprim/sequence.yaml` and each in-flight bet's `bet-decision.md`, prints a terminal board view grouped by lane (now / next / later / backlog) with door type and risk profile inline per bet
- **Added**: Advisory guidance layer — rule-based nudges about door-type sequencing (2-way before 1-way), unaddressed risks, and board shape; deterministic and owner-encoded, not LLM-generated
- **Modified**: `bet-decision.md` template — adds `## Door type` (2-way / 1-way checkbox) and `## Risk profile` section (value / usability / feasibility / business viability, each rated Low / Medium / High with a short rationale line)

## Capabilities

### New Capabilities
- `oprim-ovw-command`: The `oprim ovw` CLI subcommand — its output format, lane grouping, door-type and risk-profile display per bet, and the advisory rule engine
- `bet-risk-profile`: The door type and risk profile fields in `bet-decision.md` — their structure, meaning, and how `oprim ovw` reads and interprets them to produce guidance

### Modified Capabilities
<!-- None — existing sequencing-view and sequencing-board specs cover agent-driven views; this is a new, separate CLI surface -->

## Impact

- `packages/cli/src/cli.ts` — register `ovw` subcommand
- `packages/cli/src/commands/ovw.ts` — new file; parses `sequence.yaml` and bet-decision.md files, renders board with risk metadata and advisory nudges
- `packages/cli/src/lib/install-agent.ts` — update `betSkill()` template content to include Door type and Risk profile sections
- No agent skill changes — this command intentionally replaces the agent path for read-only board display and guidance

## Context

- Bet: `oprim/bets/BET-015-add-oprim-status-cli-command-for-board/bet-decision.md` (BET-015)
- Decision date: 2026-06-27
- Owner: Eshane
