## Context

- Bet: BET-009
- Bet decision: oprim/bets/BET-009/bet-decision.md

## Why

The bet list grows unboundedly as bets complete — without an archival mechanism, every bet ever created stays in `sequence.yaml` and `oprim/bets/` forever, creating noise when scanning the board to plan next work. Extending the archive pattern already proven in openspec keeps the active board clean while preserving full audit trail.

## What Changes

- A new `oprim:archive` skill archives a completed bet — moves it to `oprim/bets/archived/BET-NNN/` and removes its `sequence.yaml` entry; the skill has no knowledge of openspec
- A `UserPromptSubmit` hook (`.claude/hooks/on-prompt-submit.sh`) fires when the user types an archive slash command, writing the change name to a flag file; a `Stop` hook (`.claude/hooks/on-stop.sh`) reads the flag after Claude finishes and injects a co-archival prompt — neither skill package owns the dependency
- An install-time prompt in `oprim init/update` records which speccing framework is in use (`.claude/hooks/config.json`) so the hooks know which slash commands to watch for
- `sequence.yaml` entries for archived bets are removed from all active buckets (now/next/later/backlog)
- The original `bet-decision.md` is preserved in the archive folder — nothing is deleted
- Archival is always explicit and user-triggered — no automatic triggers

## Capabilities

### New Capabilities

- `bet-archiving`: Skill and UserPromptSubmit+Stop hooks for archiving a completed bet — the skill handles bet-only archival; the hooks coordinate co-archival when an openspec change is archived first

### Modified Capabilities

- `sequencing-board`: Add requirement that archived bets SHALL be excluded from all active buckets in `sequence.yaml`

## Impact

- New `oprim:archive` skill file
- New `.claude/hooks/on-prompt-submit.sh` — UserPromptSubmit hook
- New `.claude/hooks/on-stop.sh` — Stop hook
- New `.claude/hooks/config.json` — framework config written by installer
- `.claude/settings.json` (UserPromptSubmit + Stop hook registration; legacy PostToolUse entry removed)
- `oprim/bets/` directory structure gains an `archived/` subfolder convention
- `sequence.yaml` (entries removed on archive)
- `openspec/specs/sequencing-board/spec.md` (delta: archived bets excluded from active buckets)
