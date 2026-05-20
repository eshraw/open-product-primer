## ADDED Requirements

### Requirement: Bet promotion SHALL create explicit linkage to OpenSpec changes
The system SHALL define a promotion contract where prioritized bets are linked to OpenSpec change directories without duplicating implementation details in primer artifacts.

#### Scenario: Promote a bet into an OpenSpec change
- **WHEN** a user promotes `BET-XXX` for implementation
- **THEN** the bet artifact links to the created OpenSpec change path and OpenSpec artifacts reference the originating bet ID

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
