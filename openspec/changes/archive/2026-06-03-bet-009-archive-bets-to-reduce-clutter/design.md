## Context

Currently `oprim/bets/` accumulates every bet directory ever created and `sequence.yaml` holds every bet ID across all buckets. As the backlog grows, the active planning view becomes cluttered with completed work. The openspec side already has an `opsx:archive` pattern for archiving completed changes — this bet mirrors that pattern for the bets layer.

## Goals / Non-Goals

**Goals:**
- `oprim:archive` skill moves a completed bet directory from `oprim/bets/BET-NNN/` to `oprim/bets/archived/BET-NNN/`
- The skill removes the bet's entry from all buckets in `sequence.yaml`
- The archive is human-readable and browsable — no opaque formats
- The skill reports what was moved and confirms the active list is now clean

**Non-Goals:**
- Automatic archival on status change — always user-triggered
- Deleting bet files — moves only, full audit trail preserved
- Bulk-archive of multiple bets in a single invocation (single bet per command)
- Modifying the `bet-decision.md` status field on archive (status stays as-is; location is the signal)

## Decisions

**UserPromptSubmit + Stop hooks as the coordination layer — neither skill package owns the dependency**
Two hooks configured in `.claude/settings.json` coordinate co-archival without touching the skill packages. A `UserPromptSubmit` hook (`.claude/hooks/on-prompt-submit.sh`) fires when the user submits a prompt — if it matches an archive slash command (e.g. `/opsx:archive`), it writes the change name to a flag file (`.claude/hooks/.archive-pending`). A `Stop` hook (`.claude/hooks/on-stop.sh`) fires when Claude finishes responding — it reads the flag, resolves the archived change, finds the linked Bet ID in `proposal.md`, and outputs `{"decision":"block","reason":"..."}` to inject a co-archive prompt before Claude stops. The flag carries the change name (or is empty for the no-arg case, in which case on-stop.sh infers the most recently archived change by scanning `openspec/changes/archive/`). The hooks know which slash commands to watch for via a `config.json` written by the installer at `oprim init/update` time — this is where the framework choice (currently only openspec) is recorded.

This approach works regardless of whether `opsx:archive` is invoked as a slash command or via the Skill tool, since it hooks into the user's prompt rather than tool execution. `opsx:archive` needs no changes; `oprim:archive` has no knowledge of openspec; the glue lives in hook files owned by oprim.

**`oprim/bets/archived/` subfolder over a separate top-level directory**
Keeps archived bets co-located with active ones under `oprim/bets/`, so the directory structure stays self-explanatory. A separate `oprim/archived/` would require knowing to look in two places.

**Remove from sequence.yaml entirely (not a status flag)**
Marking entries `status: archived` would still inflate `sequence.yaml` over time. Full removal keeps the file lean and the board fast to scan. The archive folder is the record of what was done.

**Single-bet archival per invocation**
Batch archival adds complexity (partial failure handling, confirmation UX) with low marginal value. Users archive one bet at a time after confirming it's done.

## Risks / Trade-offs

- [Bet ID referenced in another bet's `blocked_by`/`unlocks`] → The skill SHALL warn if the target bet appears in any other sequence.yaml entry before archiving
- [Archived bet hard to discover later] → Mitigated by keeping `oprim/bets/archived/` browsable and human-readable; no index needed
- [User archives a bet that isn't truly done] → Accepted risk; archival is reversible by moving the directory back and re-adding to sequence.yaml

## Risks / Trade-offs (additional)

- [opsx:archive is renamed in a future openspec version] → Hook silently stops firing; fix is a one-line string update in `config.json`'s `archive_commands` list. Accepted — not worth a convention for a string change.

## Migration Plan

- No migration of existing data required — the `archived/` subfolder is created on first use
- No changes to existing `sequence.yaml` schema
