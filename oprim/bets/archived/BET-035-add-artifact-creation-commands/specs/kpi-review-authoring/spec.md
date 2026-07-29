## ADDED Requirements

### Requirement: The system SHALL provide a /oprim:review command to create KPI review artifacts
The system SHALL provide an agent command `/oprim:review` that creates `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md`, pre-populated from the bet's `criteria.yaml` with baseline and target values, and prompts the user for actual results.

#### Scenario: Create a KPI review pre-filled from criteria contract
- **WHEN** a user invokes `/oprim:review BET-NNN` and `primer/bets/BET-NNN/criteria.yaml` exists
- **THEN** the command creates a review artifact with a metric table containing baseline and target values from the criteria contract and prompts the user to supply actual values for each metric

#### Scenario: Create a KPI review without a criteria contract
- **WHEN** `/oprim:review BET-NNN` is invoked and no `criteria.yaml` exists for that bet
- **THEN** the command creates a review with an empty metric table and advises the user to either add metrics manually or run `/oprim:criteria` first

### Requirement: /oprim:review SHALL set metric status based on actual vs target comparison
The command SHALL evaluate each metric's actual value against its target and set the status field to `hit`, `missed`, or `pending` accordingly.

#### Scenario: Actual value meets or exceeds target
- **WHEN** the actual value provided by the user is greater than or equal to the metric target
- **THEN** the metric status is set to `hit`

#### Scenario: Actual value is below target
- **WHEN** the actual value provided by the user is less than the metric target
- **THEN** the metric status is set to `missed`

#### Scenario: Actual value not yet available
- **WHEN** the user indicates that actuals are not yet available for a metric
- **THEN** the metric status is set to `pending`

### Requirement: /oprim:review SHALL include decision-quality follow-up actions
The review artifact SHALL contain an Actions checklist that includes entries to update the bet-decision outcome section, update affected PDRs, and re-sequence impacted bets.

#### Scenario: Review artifact contains standard follow-up actions
- **WHEN** a KPI review is created
- **THEN** the artifact includes an Actions section with checkboxes for updating bet-decision, updating PDRs, and re-sequencing impacted bets
