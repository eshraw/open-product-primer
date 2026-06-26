## Why

Bet directories use opaque `BET-NNN/` names that give no context without opening the file. PDRs and OpenSpec changes already use slug-based naming — bets should match to enable faster filesystem navigation and sequencing reviews.

## What Changes

- `oprim-bet` skill creates directories as `BET-NNN-<slug>/` instead of `BET-NNN/`
- Slug is derived from the bet title (kebab-case, auto-generated)
- `oprim:archive` skill resolves a bare `BET-NNN` ID to its slug directory when moving to `archived/`
- `sequence.yaml` entries continue to use the bare `BET-NNN` ID (no slug in YAML)
- ID scanning logic in `oprim-bet` must match both `BET-NNN/` and `BET-NNN-<slug>/` directory patterns to correctly compute the next ID

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `bet-authoring`: Directory creation changes from `BET-NNN/` to `BET-NNN-<slug>/`; ID scanning logic updated to match slug directories
- `bet-archiving`: Move operations must resolve a bare `BET-NNN` ID to the actual slugged directory name before moving

## Context

- Bet: BET-012

## Impact

- `.claude/skills/oprim-bet/SKILL.md` — step 2 (ID scan) and step 5 (directory creation) updated
- `.claude/skills/oprim-archive/SKILL.md` — bet directory resolution step updated
- Existing `BET-NNN/` directories remain valid; no migration required for already-created bets
