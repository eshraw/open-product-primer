## ADDED Requirements

### Requirement: The system SHALL provide the oprim:archive skill to archive a completed bet
The system SHALL provide an `oprim:archive` skill that accepts a bare bet ID (e.g., `BET-005`), resolves it to the actual directory name in `oprim/bets/` (which may include a slug, e.g., `BET-005-improve-xyz/`), moves that directory to `oprim/bets/archived/`, and removes the bet's entry from all buckets in `sequence.yaml`. The skill has no knowledge of OpenSpec changes.

#### Scenario: Archive a bet with a slug directory
- **WHEN** a user invokes `oprim:archive` with a bare ID (e.g., BET-012) and the directory is `oprim/bets/BET-012-add-title-slugs-to-bet-dirs/`
- **THEN** the skill moves `oprim/bets/BET-012-add-title-slugs-to-bet-dirs/` to `oprim/bets/archived/BET-012-add-title-slugs-to-bet-dirs/`, removes the BET-012 entry from `sequence.yaml`, and reports success with the archive path

#### Scenario: Archive a bet with a legacy non-slug directory
- **WHEN** a user invokes `oprim:archive` with a bare ID (e.g., BET-005) and the directory is `oprim/bets/BET-005/` (no slug)
- **THEN** the skill moves `oprim/bets/BET-005/` to `oprim/bets/archived/BET-005/` and proceeds normally

#### Scenario: Archive with non-existent bet ID
- **WHEN** the user provides a bet ID that matches no directory (with or without slug) in `oprim/bets/`
- **THEN** the skill reports that the bet was not found and takes no action

### Requirement: oprim:archive SHALL warn if the target bet is referenced by other active bets
Before archiving, the skill SHALL check `sequence.yaml` for any other entry that references the target bet ID in its `blocked_by` or `unlocks` fields. If found, the skill SHALL display a warning and prompt the user to confirm before proceeding.

#### Scenario: Bet referenced in another bet's blocked_by
- **WHEN** the user invokes `oprim:archive BET-005` and BET-007 has `blocked_by: [BET-005]` in `sequence.yaml`
- **THEN** the skill shows a warning listing the dependent bets and prompts for confirmation before archiving

#### Scenario: No references found — archive proceeds without warning
- **WHEN** the target bet ID does not appear in any other entry's `blocked_by` or `unlocks`
- **THEN** the skill archives the bet without showing a dependency warning

### Requirement: oprim:archive SHALL preserve all bet artifacts in the archive location
The move SHALL preserve the complete contents of the bet directory. Nothing SHALL be deleted.

#### Scenario: Archived bet directory is fully intact
- **WHEN** a bet is archived
- **THEN** `oprim/bets/archived/BET-NNN/` contains all files that were in `oprim/bets/BET-NNN/` before archiving

### Requirement: oprim init and oprim update SHALL install the archive skill, command, hook script, and settings.json entry
When `oprim init` or `oprim update` installs skills for the Claude agent, the installer SHALL:
- Write `.claude/skills/oprim-archive/SKILL.md`
- Write `.claude/commands/oprim/archive.md`
- Write `.claude/hooks/on-skill-archive.sh` (executable)
- Merge the PostToolUse/Skill hook entry into `.claude/settings.json` without clobbering existing entries

#### Scenario: Fresh install via oprim init
- **WHEN** a user runs `oprim init` and selects Claude as the agent
- **THEN** all four archive artefacts are present and the hook is registered in settings.json

#### Scenario: Idempotent re-run via oprim update
- **WHEN** a user runs `oprim update` on a project where the hook is already registered
- **THEN** no duplicate hook entry is added to settings.json

### Requirement: oprim doctor SHALL surface the hook and settings.json status
`oprim doctor` SHALL include two non-required checks for the Claude agent:
1. `.claude/hooks/on-skill-archive.sh` exists — fix hint: "Run 'oprim update' to install"
2. `.claude/settings.json` PostToolUse hook is registered — fix hint: "Run 'oprim update' to register the hook"

#### Scenario: Doctor reports hook missing after manual deletion
- **WHEN** `.claude/hooks/on-skill-archive.sh` has been deleted
- **THEN** `oprim doctor` shows a yellow `○` warning for that check

### Requirement: A PostToolUse hook SHALL prompt co-archival of the linked bet when an openspec archive skill runs
The system SHALL register a `PostToolUse` hook on the `Skill` tool in `.claude/settings.json`. When the hook detects that the skill name matches `opsx:archive` or `openspec-archive-change`, it SHALL inject a message into Claude's context instructing it to check the archived change's `proposal.md` `## Context` section for a Bet ID and invoke `oprim:archive` for that bet if one is found.

#### Scenario: opsx:archive runs on a change linked to a bet — hook triggers co-archival
- **WHEN** the `opsx:archive` or `openspec-archive-change` skill completes
- **THEN** the PostToolUse hook fires and Claude is prompted to check the archived change for a linked bet ID and invoke `oprim:archive` if one is present

#### Scenario: opsx:archive runs on a change with no linked bet — hook fires but no bet action taken
- **WHEN** the `opsx:archive` or `openspec-archive-change` skill completes and the archived proposal has no Bet ID in `## Context`
- **THEN** Claude sees the hook prompt, finds no bet ID, and takes no bet-related action

#### Scenario: Hook does not fire for non-archive skills
- **WHEN** the `Skill` tool runs any skill other than `opsx:archive` or `openspec-archive-change`
- **THEN** the hook exits without output and no bet-related prompt is injected
