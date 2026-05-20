## ADDED Requirements

### Requirement: Sequencing SHALL be represented as structured Now/Next/Later data
The system SHALL represent sequencing in a structured artifact that includes at least `now`, `next`, `later`, and `backlog` collections.

#### Scenario: Persist sequencing board state
- **WHEN** a user updates roadmap ordering
- **THEN** the board state is stored in a structured file with all sequencing buckets

### Requirement: Sequencing entries SHALL model dependency relationships
Each sequenced bet SHALL support explicit `blocked_by`, `unlocks`, and `requires_pdrs` fields.

#### Scenario: Evaluate if a bet can move to Now
- **WHEN** a user attempts to move a bet to `now`
- **THEN** the system can determine eligibility from blockers and required PDR preconditions

### Requirement: Sequencing SHALL enforce WIP limits for active bets
The system SHALL allow WIP limits for the `now` bucket and SHALL flag board states that exceed configured limits.

#### Scenario: WIP limit exceeded
- **WHEN** the `now` bucket contains more bets than `wip_limits.now`
- **THEN** the system reports the violation and identifies which bets require rebalancing
