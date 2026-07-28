## Requirements

### Requirement: oprim SHALL organize not-yet-archived bets under oprim/bets/pending/
The system SHALL create new bet directories at `oprim/bets/pending/BET-NNN-<slug>/` instead of directly under `oprim/bets/`, so that the top-level `oprim/bets/` directory contains only a `pending/` subdirectory (for not-yet-archived bets) and an `archived/` subdirectory (for archived bets), giving an at-a-glance built-vs-in-flight signal without reading any file contents.

#### Scenario: List pending bets shows only unarchived work
- **WHEN** a user runs `ls oprim/bets/pending/`
- **THEN** only bets that have not yet been archived are listed, requiring no further file inspection to determine build status

#### Scenario: List archived bets shows only completed work
- **WHEN** a user runs `ls oprim/bets/archived/`
- **THEN** only bets that have already been folded into current truth are listed

### Requirement: Bet ID scanning SHALL span both oprim/bets/pending/ and oprim/bets/archived/
Any skill or tool that computes the next available bet ID, or resolves an existing bare bet ID (e.g. `BET-012`) to its actual directory, SHALL scan both `oprim/bets/pending/` and `oprim/bets/archived/` for directories matching `BET-(\d+)` (with or without a trailing slug), consistent with the prior behavior of scanning the flat `oprim/bets/` and `oprim/bets/archived/` directories.

#### Scenario: Next bet ID computed across both directories
- **WHEN** `oprim/bets/pending/` contains `BET-030-...` and `BET-031-...`, and `oprim/bets/archived/` contains up to `BET-029`
- **THEN** the next assigned bet ID is `BET-032`, computed as max + 1 across both directories

#### Scenario: Resolve a bare bet ID to its pending directory
- **WHEN** a skill is invoked with a bare ID (e.g. `BET-030`) and the matching directory is `oprim/bets/pending/BET-030-add-list-show-and-status-json-commands/`
- **THEN** the skill resolves to that directory under `pending/`, not to a flat `oprim/bets/BET-030.../` path
