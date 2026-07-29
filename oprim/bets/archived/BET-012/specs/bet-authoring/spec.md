## MODIFIED Requirements

### Requirement: The system SHALL provide the oprim-bet skill to scaffold new bet artifacts
The system SHALL provide the `oprim-bet` skill that creates a new bet directory `oprim/bets/BET-NNN-<slug>/`, writes a populated `bet-decision.md` from the template, and adds the bet to the `backlog` list in `oprim/sequence.yaml`. The slug SHALL be derived from the bet title in kebab-case.

#### Scenario: Create a new bet with auto-assigned ID and slug
- **WHEN** a user invokes the `oprim-bet` skill with a bet title
- **THEN** the skill scans `oprim/bets/` and `oprim/bets/archived/` for directories matching `BET-(\d+)` (with or without a trailing slug), assigns next = max + 1, derives a kebab-case slug from the title, creates `oprim/bets/BET-NNN-<slug>/bet-decision.md`, and appends an entry to `oprim/sequence.yaml` backlog with the bare `BET-NNN` ID

#### Scenario: Create first bet in an empty bets directory
- **WHEN** `oprim/bets/` exists but contains no BET directories
- **THEN** the skill assigns BET-001, derives a slug from the title, and creates `oprim/bets/BET-001-<slug>/`

#### Scenario: ID scanning handles both slug and non-slug directories
- **WHEN** `oprim/bets/` contains a mix of `BET-NNN/` and `BET-NNN-<slug>/` directories
- **THEN** the skill extracts the numeric part from both formats and computes max + 1 correctly
