## Requirements

### Requirement: The system SHALL provide the oprim-bet skill to scaffold new bet artifacts
The system SHALL provide the `oprim-bet` skill that creates a new bet directory `primer/bets/BET-NNN/`, writes a populated `bet-decision.md` from the template, and adds the bet to the `backlog` list in `primer/sequence.yaml`.

#### Scenario: Create a new bet with auto-assigned ID
- **WHEN** a user invokes the `oprim-bet` skill with a bet title or description
- **THEN** the skill scans `primer/bets/` for the highest existing BET number, assigns next = max + 1, creates `primer/bets/BET-NNN/bet-decision.md`, and appends an entry to `primer/sequence.yaml` backlog

#### Scenario: Create first bet in an empty bets directory
- **WHEN** `primer/bets/` exists but contains no BET directories
- **THEN** the skill assigns BET-001 and creates the bet directory

### Requirement: oprim-bet SHALL populate all required bet-decision sections
The skill SHALL write a complete bet-decision artifact including status (defaulting to "Build now"), decision date, owner, why-now rationale, alternatives considered, expected outcomes, and kill criteria. After writing `bet-decision.md`, the skill SHALL prompt the user to optionally scaffold a `discovery.md` in the same bet directory.

#### Scenario: Populate bet decision from user-provided rationale
- **WHEN** the user provides a bet title, why-now rationale, and expected outcomes
- **THEN** the resulting `bet-decision.md` contains all required sections with user-provided content and placeholder text for sections not yet specified

#### Scenario: User opts in to discovery scaffolding
- **WHEN** the bet decision is written and the user responds "y" to the discovery prompt
- **THEN** `oprim/bets/BET-NNN/discovery.md` is created from the discovery template
- **AND** the skill reports both files as created

#### Scenario: User skips discovery scaffolding
- **WHEN** the bet decision is written and the user responds "n" or presses Enter at the discovery prompt
- **THEN** only `bet-decision.md` is created
- **AND** no error or warning is shown

### Requirement: oprim-bet SHALL add the new bet to primer/sequence.yaml backlog
The skill SHALL append the new bet to the `backlog` list in `primer/sequence.yaml` with its ID and title. The entry SHALL include empty `blocked_by`, `unlocks`, and `requires_pdrs` fields ready for the user to populate.

#### Scenario: Bet added to sequence backlog on creation
- **WHEN** a new bet is successfully created
- **THEN** `primer/sequence.yaml` contains a new backlog entry with the bet's ID and title

#### Scenario: sequence.yaml is missing
- **WHEN** the `oprim-bet` skill is invoked and `primer/sequence.yaml` does not exist
- **THEN** the skill reports that `primer/sequence.yaml` is missing and advises the user to run `oprim init` before creating bets

### Requirement: oprim-bet SHALL support optional PDR linking at creation time
The skill SHALL accept one or more existing PDR IDs to link at creation, populating the `PDRs` field in the bet-decision Links section.

#### Scenario: Link PDRs during bet creation
- **WHEN** the user specifies PDR IDs when creating a bet
- **THEN** the bet-decision Links section references those PDR IDs

### Requirement: oprim-bet SHALL display a naming convention before prompting for the title
Before asking the user for a bet title, the skill SHALL display a brief naming convention guide with a good and bad example so the user can write a clear title from the start.

#### Scenario: Naming convention shown before title prompt
- **WHEN** the user invokes the `oprim-bet` skill
- **THEN** the skill displays a naming tip (e.g., "Good: 'Improve bet naming for scannability' / Bad: 'Naming'") before asking for the title

### Requirement: oprim-bet SHALL warn when a bet title is too short to be self-explanatory
The skill SHALL check the provided title and, if it is fewer than 4 words or fewer than 25 characters, show a soft warning with a reformulation suggestion. The user MAY proceed with the original title.

#### Scenario: Short title triggers a soft warning
- **WHEN** the user provides a title with fewer than 4 words or fewer than 25 characters
- **THEN** the skill shows a warning message noting the title may be too vague, suggests a reformulated example, and prompts the user to confirm or revise

#### Scenario: Short title accepted after confirmation
- **WHEN** the user confirms they want to keep a short title after seeing the warning
- **THEN** the skill proceeds with the original title and creates the bet normally

#### Scenario: Title meeting the convention proceeds without warning
- **WHEN** the user provides a title with 4 or more words and 25 or more characters
- **THEN** the skill creates the bet without showing any warning

### Requirement: oprim-bet SHALL include a naming tip in the scaffolded bet-decision.md template
The generated `bet-decision.md` SHALL include an inline comment in the title/header area showing the naming convention so it is visible when the file is first opened.

#### Scenario: Naming tip present in scaffolded file
- **WHEN** a new `bet-decision.md` is created by the `oprim-bet` skill
- **THEN** the file contains a comment or example adjacent to the title field showing the recommended naming format
