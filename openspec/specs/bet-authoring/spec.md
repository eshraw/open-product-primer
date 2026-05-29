## ADDED Requirements

### Requirement: The system SHALL provide a /oprim:bet command to scaffold new bet artifacts
The system SHALL provide an agent command `/oprim:bet` that creates a new bet directory `primer/bets/BET-NNN/`, writes a populated `bet-decision.md` from the template, and adds the bet to the `backlog` list in `primer/sequence.yaml`.

#### Scenario: Create a new bet with auto-assigned ID
- **WHEN** a user invokes `/oprim:bet` with a bet title or description
- **THEN** the command scans `primer/bets/` for the highest existing BET number, assigns next = max + 1, creates `primer/bets/BET-NNN/bet-decision.md`, and appends an entry to `primer/sequence.yaml` backlog

#### Scenario: Create first bet in an empty bets directory
- **WHEN** `primer/bets/` exists but contains no BET directories
- **THEN** the command assigns BET-001 and creates the bet directory

### Requirement: /oprim:bet SHALL populate all required bet-decision sections
The command SHALL write a complete bet-decision artifact including status (defaulting to "Build now"), decision date, owner, why-now rationale, alternatives considered, expected outcomes, and kill criteria. After writing `bet-decision.md`, the command SHALL prompt the user to optionally scaffold a `discovery.md` in the same bet directory.

#### Scenario: Populate bet decision from user-provided rationale
- **WHEN** the user provides a bet title, why-now rationale, and expected outcomes
- **THEN** the resulting `bet-decision.md` contains all required sections with user-provided content and placeholder text for sections not yet specified

#### Scenario: User opts in to discovery scaffolding
- **WHEN** the bet decision is written and the user responds "y" to the discovery prompt
- **THEN** `oprim/bets/BET-NNN/discovery.md` is created from the discovery template
- **AND** the command reports both files as created

#### Scenario: User skips discovery scaffolding
- **WHEN** the bet decision is written and the user responds "n" or presses Enter at the discovery prompt
- **THEN** only `bet-decision.md` is created
- **AND** no error or warning is shown

### Requirement: /oprim:bet SHALL add the new bet to primer/sequence.yaml backlog
The command SHALL append the new bet to the `backlog` list in `primer/sequence.yaml` with its ID and title. The entry SHALL include empty `blocked_by`, `unlocks`, and `requires_pdrs` fields ready for the user to populate.

#### Scenario: Bet added to sequence backlog on creation
- **WHEN** a new bet is successfully created
- **THEN** `primer/sequence.yaml` contains a new backlog entry with the bet's ID and title

#### Scenario: sequence.yaml is missing
- **WHEN** `/oprim:bet` is invoked and `primer/sequence.yaml` does not exist
- **THEN** the command reports that `primer/sequence.yaml` is missing and advises the user to run `oprim init` before creating bets

### Requirement: /oprim:bet SHALL support optional PDR linking at creation time
The command SHALL accept one or more existing PDR IDs to link at creation, populating the `PDRs` field in the bet-decision Links section.

#### Scenario: Link PDRs during bet creation
- **WHEN** the user specifies PDR IDs when creating a bet
- **THEN** the bet-decision Links section references those PDR IDs
