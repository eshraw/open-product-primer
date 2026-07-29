## MODIFIED Requirements

### Requirement: The system SHALL provide the oprim:archive skill to archive a completed bet
The system SHALL provide an `oprim:archive` skill that accepts a bare bet ID (e.g., `BET-005`), resolves it to the actual directory name in `oprim/bets/` (which may include a slug, e.g., `BET-005-improve-xyz/`), moves that directory to `oprim/bets/archived/`, and removes the bet's entry from all buckets in `sequence.yaml`. If the bet directory contains an `specs/` subdirectory with delta spec files, the skill SHALL fold those deltas into the corresponding `oprim/specs/<capability>/spec.md` current-truth files (matching requirements by `### Requirement:` header text, whitespace-insensitive) before completing the move. The skill has no knowledge of OpenSpec changes.

#### Scenario: Archive a bet with a slug directory
- **WHEN** a user invokes `oprim:archive` with a bare ID (e.g., BET-012) and the directory is `oprim/bets/BET-012-add-title-slugs-to-bet-dirs/`
- **THEN** the skill moves `oprim/bets/BET-012-add-title-slugs-to-bet-dirs/` to `oprim/bets/archived/BET-012-add-title-slugs-to-bet-dirs/`, removes the BET-012 entry from `sequence.yaml`, and reports success with the archive path

#### Scenario: Archive a bet with a legacy non-slug directory
- **WHEN** a user invokes `oprim:archive` with a bare ID (e.g., BET-005) and the directory is `oprim/bets/BET-005/` (no slug)
- **THEN** the skill moves `oprim/bets/BET-005/` to `oprim/bets/archived/BET-005/` and proceeds normally

#### Scenario: Archive with non-existent bet ID
- **WHEN** the user provides a bet ID that matches no directory (with or without slug) in `oprim/bets/`
- **THEN** the skill reports that the bet was not found and takes no action

#### Scenario: Archive a bet with spec deltas — deltas merge into current truth
- **WHEN** a user invokes `oprim:archive BET-NNN` and `oprim/bets/BET-NNN.../specs/<capability>/spec.md` exists with `## ADDED`/`## MODIFIED`/`## REMOVED Requirements` sections
- **THEN** the skill folds each delta requirement into `oprim/specs/<capability>/spec.md` (matching `### Requirement:` headers, whitespace-insensitive) before moving the bet directory to `oprim/bets/archived/`, and the merged current-truth file reflects the bet's changes

#### Scenario: Archive a bet with no spec deltas — unchanged behavior
- **WHEN** a user invokes `oprim:archive BET-NNN` and no `oprim/bets/BET-NNN.../specs/` directory exists
- **THEN** the skill archives the bet exactly as before, with no merge step attempted

#### Scenario: Two active bets hold deltas against the same capability — later archive wins on overlap
- **WHEN** `BET-010` and `BET-011` both carry a delta for the same requirement in capability `foo`, and `BET-010` is archived first, then `BET-011`
- **THEN** `oprim/specs/foo/spec.md` reflects `BET-010`'s delta after the first archive, and reflects `BET-011`'s delta (overwriting the overlapping requirement) after the second archive
