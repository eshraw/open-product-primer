## Why

Open Product Primer has templates and a `primer/` scaffold but no agent commands to actually create or populate artifacts — users must manually copy templates, assign IDs, and fill in structure. Every PDR, bet, criteria contract, and KPI review requires the same repetitive scaffolding that an agent should handle.

## What Changes

- Add `/oprim:pdr` command to create and update Product Decision Records with auto-assigned IDs and guided prompting.
- Add `/oprim:bet` command to scaffold a new bet directory (`primer/bets/BET-XXX/`), fill in the bet-decision template, and add the bet to `primer/sequence.yaml`.
- Add `/oprim:criteria` command to create or populate a `criteria.yaml` contract for an existing bet, with source mapping for Amplitude and BigQuery.
- Add `/oprim:review` command to create a KPI review artifact for a completed bet, pre-populated with metric baselines, targets, and placeholders for actuals.

## Capabilities

### New Capabilities
- `pdr-authoring`: Create and update Product Decision Records in `primer/decisions/` with auto-incremented IDs, status lifecycle, and supersession linking.
- `bet-authoring`: Scaffold new bet directories and bet-decision artifacts in `primer/bets/`, with automatic sequencing board entry in `primer/sequence.yaml`.
- `criteria-authoring`: Create and populate `criteria.yaml` contracts for a bet, with structured source mapping for Amplitude and BigQuery metrics.
- `kpi-review-authoring`: Create KPI review artifacts in `primer/reviews/`, pre-filled from the bet's criteria contract with actuals gathered from the user.

### Modified Capabilities
- `sequencing-board`: Bet creation via `/oprim:bet` automatically adds entries to `primer/sequence.yaml` (new `backlog` placement by default).

## Impact

- **Skill files**: 4 new skill files under `.claude/skills/oprim-*/SKILL.md` and `.cursor/skills/oprim-*/SKILL.md` containing complete step-by-step playbooks with exact file patterns, schemas, and write protocols.
- **Command wrappers**: 4 thin command files in `.claude/commands/oprim/` and `.cursor/commands/` that surface the commands in the palette and invoke the corresponding skill.
- **CLI distribution**: `oprim update` must distribute both skill files and command wrappers so downstream projects receive them on refresh.
- **Artifacts written**: `primer/decisions/`, `primer/bets/`, `primer/reviews/`, and `primer/sequence.yaml`.
- **No breaking changes** to existing `primer/` structure or existing commands.
