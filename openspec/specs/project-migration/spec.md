## ADDED Requirements

### Requirement: oprim SHALL provide a migrate command to rename primer/ to oprim/
The system SHALL provide `oprim migrate` that detects a `primer/` directory at the project root and renames it to `oprim/` in place, enabling existing repos to upgrade without manual file moves.

#### Scenario: Migrate a repo with an existing primer/ directory
- **WHEN** `primer/` exists and `oprim/` does not
- **THEN** `oprim migrate` renames `primer/` to `oprim/`
- **AND** reports each moved path
- **AND** exits with code 0

#### Scenario: Migrate when oprim/ already exists
- **WHEN** `oprim/` already exists at the project root
- **THEN** `oprim migrate` reports "oprim/ already exists — nothing to migrate" and exits with code 0

#### Scenario: Migrate when neither directory exists
- **WHEN** neither `primer/` nor `oprim/` exists
- **THEN** `oprim migrate` reports "No primer/ directory found — run `oprim init` to create oprim/" and exits with code 1

### Requirement: oprim migrate SHALL be a no-op safe to run multiple times
Running `oprim migrate` on an already-migrated repo SHALL not fail or corrupt state.

#### Scenario: Re-run migrate on an already-migrated repo
- **WHEN** `oprim/` exists and `primer/` does not
- **THEN** `oprim migrate` exits cleanly with an informational message and makes no filesystem changes
