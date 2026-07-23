## Requirements

### Requirement: The system SHALL provide the oprim-review skill to create KPI review artifacts
The system SHALL provide the `oprim-review` skill that creates `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md`, pre-populated from the bet's `criteria.yaml` with baseline and target values, and prompts the user for actual results.

#### Scenario: Create a KPI review pre-filled from criteria contract
- **WHEN** a user invokes the `oprim-review` skill with a bet ID and `primer/bets/BET-NNN/criteria.yaml` exists
- **THEN** the skill creates a review artifact with a metric table containing baseline and target values from the criteria contract and prompts the user to supply actual values for each metric

#### Scenario: Create a KPI review without a criteria contract
- **WHEN** the `oprim-review` skill is invoked for a bet with no `criteria.yaml`
- **THEN** the skill creates a review with an empty metric table and advises the user to either add metrics manually or use the `oprim-criteria` skill first

### Requirement: oprim-review SHALL set metric status based on actual vs target comparison
The skill SHALL evaluate each metric's actual value against its target and set the status field to `hit`, `missed`, or `pending` accordingly.

#### Scenario: Actual value meets or exceeds target
- **WHEN** the actual value provided by the user is greater than or equal to the metric target
- **THEN** the metric status is set to `hit`

#### Scenario: Actual value is below target
- **WHEN** the actual value provided by the user is less than the metric target
- **THEN** the metric status is set to `missed`

#### Scenario: Actual value not yet available
- **WHEN** the user indicates that actuals are not yet available for a metric
- **THEN** the metric status is set to `pending`

### Requirement: oprim-review SHALL include decision-quality follow-up actions
The review artifact SHALL contain an Actions checklist that includes entries to update the bet-decision outcome section, update affected PDRs, and re-sequence impacted bets.

#### Scenario: Review artifact contains standard follow-up actions
- **WHEN** a KPI review is created
- **THEN** the artifact includes an Actions section with checkboxes for updating bet-decision, updating PDRs, and re-sequencing impacted bets

### Requirement: Post-review workflow SHALL update the bet decision with an Outcomes section
After a KPI review is written, the workflow SHALL add or update an `## Outcomes` section on `primer/bets/BET-NNN/bet-decision.md` summarizing each metric as baseline → actual (target) with status, and linking to the review artifact path.

#### Scenario: Bet decision gains Outcomes after review
- **WHEN** a KPI review is completed for BET-NNN
- **THEN** `bet-decision.md` contains an `## Outcomes` section with per-metric summaries and a link to `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md`

### Requirement: Post-review workflow SHALL update PDR status when outcomes invalidate policy
When review outcomes invalidate or supersede a referenced PDR, the workflow SHALL update that PDR's `## Status` (for example to `Superseded by PDR-YYY`).

#### Scenario: PDR status updated after invalidating outcome
- **WHEN** review decision quality notes indicate a referenced PDR is no longer valid
- **THEN** the PDR file's Status field is updated to reflect supersession or deprecation

### Requirement: Post-review sequencing SHALL follow outcome-based recommendations
After review, sequence validation SHALL surface sequencing moves based on outcomes: defer follow-on bets when metrics missed, unlock dependents when metrics hit, move bets to backlog when kill criteria triggered.

#### Scenario: Missed metrics suggest deferral
- **WHEN** a review records one or more metrics as `missed`
- **THEN** sequence validation may recommend moving dependent bets from `next` to `later` until root cause is addressed

#### Scenario: Hit metrics suggest unlocking dependents
- **WHEN** a review records metrics as `hit` and dependent bets list the reviewed bet in `blocked_by`
- **THEN** sequence validation may recommend promoting those bets when other preconditions are satisfied

#### Scenario: Kill criteria triggered suggests backlog
- **WHEN** review outcomes match a bet's documented kill criteria
- **THEN** sequence validation may recommend moving associated bets to `backlog`

### Requirement: oprim-review SHALL fill in OKF frontmatter when the workspace has opted in
When `oprim/config.yaml` has `okf.enabled: true`, the `oprim-review` skill SHALL populate the OKF frontmatter block already present at the top of the scaffolded KPI review file (per the `oprim/templates/kpi-review.md` template written at `oprim init`), setting `type: kpi-review`, `title` derived from the bet ID and title, a one-line `description`, `tags` derived from the reviewed bet's subject area, and `timestamp` to the review date.

#### Scenario: Frontmatter populated on review creation when opted in
- **WHEN** a user invokes the `oprim-review` skill in a workspace where `oprim/config.yaml` has `okf.enabled: true`
- **THEN** the created review file has its frontmatter block filled in with `type: kpi-review`, a title referencing the bet, a short description, relevant tags, and the review timestamp

#### Scenario: No frontmatter handling when not opted in
- **WHEN** a user invokes the `oprim-review` skill in a workspace where `oprim/config.yaml` has `okf.enabled: false` or the field is absent
- **THEN** the created review file contains no frontmatter block, matching today's behavior exactly
