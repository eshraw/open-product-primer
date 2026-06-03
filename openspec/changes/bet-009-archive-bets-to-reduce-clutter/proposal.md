## Context

- Bet: BET-009
- Bet decision: oprim/bets/BET-009/bet-decision.md

## Why

The bet list grows unboundedly as bets complete — without an archival mechanism, every bet ever created stays in `sequence.yaml` and `oprim/bets/` forever, creating noise when scanning the board to plan next work. Extending the archive pattern already proven in openspec keeps the active board clean while preserving full audit trail.

## What Changes

- A new `oprim:archive` skill archives a completed bet — moves it to `oprim/bets/archived/BET-NNN/` and removes its `sequence.yaml` entry; the skill has no knowledge of openspec
- A `PostToolUse` hook (`.claude/hooks/on-skill-archive.sh`, wired in `.claude/settings.json`) fires after `opsx:archive` runs and prompts co-archival of the linked bet — neither skill package owns the dependency
- `sequence.yaml` entries for archived bets are removed from all active buckets (now/next/later/backlog)
- The original `bet-decision.md` is preserved in the archive folder — nothing is deleted
- Archival is always explicit and user-triggered — no automatic triggers

## Capabilities

### New Capabilities

- `bet-archiving`: Skill and PostToolUse hook for archiving a completed bet — the skill handles bet-only archival; the hook coordinates co-archival when an openspec change is archived first

### Modified Capabilities

- `sequencing-board`: Add requirement that archived bets SHALL be excluded from all active buckets in `sequence.yaml`

## Impact

- New `oprim:archive` skill file
- New `.claude/hooks/on-skill-archive.sh` hook script
- `.claude/settings.json` (PostToolUse hook registration)
- `oprim/bets/` directory structure gains an `archived/` subfolder convention
- `sequence.yaml` (entries removed on archive)
- `openspec/specs/sequencing-board/spec.md` (delta: archived bets excluded from active buckets)
