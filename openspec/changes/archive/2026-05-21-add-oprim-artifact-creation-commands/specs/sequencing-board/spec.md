## MODIFIED Requirements

### Requirement: Sequencing entries SHALL model dependency relationships
Each sequenced bet SHALL support explicit `blocked_by`, `unlocks`, and `requires_pdrs` fields. New bets created via `/oprim:bet` SHALL be added to the `backlog` collection with empty dependency fields by default.

#### Scenario: Evaluate if a bet can move to Now
- **WHEN** a user attempts to move a bet to `now`
- **THEN** the system can determine eligibility from blockers and required PDR preconditions

#### Scenario: New bet added to backlog via /oprim:bet
- **WHEN** a user creates a new bet using `/oprim:bet`
- **THEN** `primer/sequence.yaml` receives a new backlog entry with the bet's ID, title, and empty `blocked_by`, `unlocks`, and `requires_pdrs` arrays
