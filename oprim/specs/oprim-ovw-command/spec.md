## ADDED Requirements

### Requirement: `oprim ovw` SHALL print board state from sequence.yaml without agent involvement
The system SHALL provide an `ovw` subcommand that reads `oprim/sequence.yaml` and prints the board grouped by lane (now / next / later / backlog) directly to stdout. No LLM call, no agent invocation, and no file writes SHALL occur.

#### Scenario: Board displayed with lanes
- **WHEN** a user runs `oprim ovw` in a project with a populated `oprim/sequence.yaml`
- **THEN** the terminal prints each lane (now, next, later, backlog) as a labelled section
- **AND** each bet is listed with its ID and title under its assigned lane
- **AND** no file in the project is modified

#### Scenario: No sequence.yaml found
- **WHEN** a user runs `oprim ovw` and `oprim/sequence.yaml` does not exist
- **THEN** the command exits with a non-zero code and prints a clear error: "No oprim/sequence.yaml found — run 'oprim init' first"

#### Scenario: Empty board
- **WHEN** `oprim/sequence.yaml` exists but all lanes are empty
- **THEN** the command prints each lane header with "(empty)" and exits with code 0

### Requirement: `oprim ovw` SHALL show door type and risk profile inline for now and next bets
For each bet in the `now` or `next` lane, the command SHALL read the corresponding `bet-decision.md` and display door type and risk ratings inline. Bets in `later` and `backlog` SHALL show title only.

#### Scenario: In-flight bet with complete risk profile
- **WHEN** a bet in `now` has a readable `bet-decision.md` with door type and all four risk ratings
- **THEN** the output line shows: `BET-NNN  Title  [2-way | value:L usability:L feasibility:L viability:L]`

#### Scenario: In-flight bet with missing risk profile
- **WHEN** a bet in `now` has no readable `bet-decision.md` or missing risk sections
- **THEN** the output line shows: `BET-NNN  Title  [risk: unknown]`

#### Scenario: Later or backlog bet shows title only
- **WHEN** a bet is in the `later` or `backlog` lane
- **THEN** only `BET-NNN  Title` is printed — no risk metadata

### Requirement: `oprim ovw` SHALL show blocked-by relationships inline
For each bet that has a non-empty `blocked_by` list in `sequence.yaml`, the command SHALL display the blockers inline on the same row as the bet entry, appended after any risk metadata.

#### Scenario: Blocked bet shows its blockers
- **WHEN** a bet in any lane has `blocked_by: [BET-XXX]`
- **THEN** the output line includes `[blocked by: BET-XXX]`

#### Scenario: Unblocked bet shows no blocker annotation
- **WHEN** a bet has an empty `blocked_by` list
- **THEN** no blocker annotation appears on its output line

### Requirement: `oprim ovw` SHALL surface rule-based board-shape nudges
After printing the board, the command SHALL evaluate board-shape rules and print triggered nudges in an "Advisory" section. Rules are deterministic and SHALL NOT involve LLM generation.

#### Scenario: Now lane is empty
- **WHEN** the `now` lane has zero bets
- **THEN** the Advisory section includes: "Now lane is empty — consider promoting from next"

#### Scenario: Stuck bet in now — blocker not in flight
- **WHEN** a bet in `now` has a `blocked_by` entry that is not in `now` or `next`
- **THEN** the Advisory section includes: "BET-NNN may be stuck — its blocker is not in a flight lane"

#### Scenario: Now lane overloaded
- **WHEN** the `now` lane contains more than 3 bets
- **THEN** the Advisory section includes: "Focus risk: now lane has N active bets — consider narrowing"

### Requirement: `oprim ovw` SHALL surface door-type sequencing advisory nudges
The command SHALL evaluate door-type sequencing rules across in-flight bets and surface nudges when the sequencing order risks committing to irreversible work without prior validation.

#### Scenario: 1-way door in now with no 2-way unrisker in flight
- **WHEN** a bet in `now` is a 1-way door and no 2-way door bet in `now` or `next` has it in its `unlocks` list
- **THEN** the Advisory section includes: "BET-NNN is a 1-way door with no 2-way door unrisker in flight — consider sequencing a reversible spike first"

#### Scenario: All now bets are 1-way doors
- **WHEN** every bet in `now` is a 1-way door
- **THEN** the Advisory section includes: "Your now lane has no 2-way door bets — you are in full-commitment mode with no reversible fallback"

#### Scenario: 2-way door sequenced after the 1-way door it should unrisk
- **WHEN** a 2-way door bet has a `blocked_by` entry that is a 1-way door bet
- **THEN** the Advisory section includes: "BET-NNN (2-way) is blocked by BET-MMM (1-way) — order may be inverted; 2-way doors should precede 1-way doors"

### Requirement: `oprim ovw` SHALL surface risk-based advisory nudges for in-flight bets
The command SHALL evaluate risk profiles of bets in `now` and emit advisory nudges for any Medium or High rated risk dimensions, guiding the user toward mitigation actions.

#### Scenario: High value risk on a 1-way door bet
- **WHEN** a bet in `now` has Medium or High value risk and is a 1-way door
- **THEN** the Advisory section includes: "BET-NNN: high commitment with unvalidated value — consider a 2-way door discovery bet first"

#### Scenario: Elevated feasibility risk
- **WHEN** a bet in `now` has Medium or High feasibility risk
- **THEN** the Advisory section includes: "BET-NNN: feasibility risk is elevated — ensure a spike or prototype is in plan before full build"

#### Scenario: Elevated usability risk
- **WHEN** a bet in `now` has Medium or High usability risk
- **THEN** the Advisory section includes: "BET-NNN: usability risk is elevated — plan for user testing before shipping"

#### Scenario: Elevated business viability risk
- **WHEN** a bet in `now` has Medium or High business viability risk
- **THEN** the Advisory section includes: "BET-NNN: business viability risk is elevated — align with stakeholders before committing"

#### Scenario: No advisory nudges triggered
- **WHEN** no board-shape, door-type, or risk rules fire
- **THEN** the Advisory section is omitted from output entirely

### Requirement: `oprim ovw` output SHALL be pipe-friendly
Bet rows SHALL use plain text. Color accents (chalk) SHALL be applied only to lane headers and the Advisory section header, so that piped output remains readable without ANSI stripping.

#### Scenario: Output piped to grep
- **WHEN** a user runs `oprim ovw | grep BET-015`
- **THEN** the matched line is readable plain text containing the bet ID and title
