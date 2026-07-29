## MODIFIED Requirements

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
