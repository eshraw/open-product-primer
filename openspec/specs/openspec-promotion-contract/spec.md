## ADDED Requirements

### Requirement: Bet promotion SHALL create explicit linkage to OpenSpec changes
The system SHALL define a promotion contract where prioritized bets are linked to OpenSpec change directories without duplicating implementation details in primer artifacts, and where notes promoted into a bet are linked to that bet.

#### Scenario: Promote a bet into an OpenSpec change
- **WHEN** a user promotes `BET-XXX` for implementation
- **THEN** the bet artifact links to the created OpenSpec change path and OpenSpec artifacts reference the originating bet ID

#### Scenario: Promote a note into a bet
- **WHEN** a user runs `/oprim:promote NOTE-XXX`
- **THEN** a new `BET-NNN` bet is created with `bet-decision.md`'s `Why now` pre-filled from the note's body, the note links to the resulting bet ID, and the bet is registered in `oprim/sequence.yaml`

### Requirement: Promotion SHALL dispatch on ID prefix without a separate command
The `/oprim:promote` skill SHALL determine which promotion path to run — bet → OpenSpec change, or note → bet — solely from the prefix of the ID argument (`BET-` or `NOTE-`), without requiring a distinct command or subcommand for each path.

#### Scenario: BET- prefix resolves to bet promotion
- **WHEN** a user runs `/oprim:promote BET-042`
- **THEN** the skill runs the existing bet → OpenSpec-change promotion path unchanged

#### Scenario: NOTE- prefix resolves to note promotion
- **WHEN** a user runs `/oprim:promote NOTE-005`
- **THEN** the skill runs the note → bet promotion path

#### Scenario: Unrecognized ID prefix is reported, not silently ignored
- **WHEN** a user runs `/oprim:promote` with an ID matching neither `BET-` nor `NOTE-`
- **THEN** the skill reports that the ID prefix is unrecognized instead of performing no action silently

### Requirement: Promotion SHALL preserve authority boundaries
The system SHALL enforce that primer artifacts own prioritization rationale and outcomes, while OpenSpec artifacts own implementation requirements and design.

#### Scenario: Validate artifact ownership after promotion
- **WHEN** a promotion completes
- **THEN** primer artifacts contain why/order/outcome data and OpenSpec artifacts contain what/how implementation data

### Requirement: Promotion SHALL carry measurement contracts forward
The system SHALL ensure bet criteria contracts remain linked to the resulting OpenSpec change so KPI automation can evaluate shipped outcomes against expected results.

#### Scenario: Associate criteria contract with promoted change
- **WHEN** a change is generated from a promoted bet
- **THEN** the criteria contract path is linked from both the bet decision and OpenSpec proposal context
