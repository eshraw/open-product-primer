## ADDED Requirements

### Requirement: Sequencing SHALL be represented as structured Now/Next/Later data
The system SHALL represent sequencing in a structured artifact that includes at least `now`, `next`, `later`, and `backlog` collections.

#### Scenario: Persist sequencing board state
- **WHEN** a user updates primer sequencing
- **THEN** the board state is stored in a structured file with all sequencing buckets

### Requirement: Sequencing entries SHALL model dependency relationships
Each sequenced bet SHALL support explicit `blocked_by`, `unlocks`, and `requires_pdrs` fields. New bets created via `/oprim:bet` SHALL be added to the `backlog` collection with empty dependency fields by default.

#### Scenario: Evaluate if a bet can move to Now
- **WHEN** a user attempts to move a bet to `now`
- **THEN** the system can determine eligibility from blockers and required PDR preconditions

#### Scenario: New bet added to backlog via /oprim:bet
- **WHEN** a user creates a new bet using `/oprim:bet`
- **THEN** `primer/sequence.yaml` receives a new backlog entry with the bet's ID, title, and empty `blocked_by`, `unlocks`, and `requires_pdrs` arrays

### Requirement: Sequencing SHALL enforce WIP limits for active bets
The system SHALL allow WIP limits for the `now` bucket and SHALL flag board states that exceed configured limits.

#### Scenario: WIP limit exceeded
- **WHEN** the `now` bucket contains more bets than `wip_limits.now`
- **THEN** the system reports the violation and identifies which bets require rebalancing
