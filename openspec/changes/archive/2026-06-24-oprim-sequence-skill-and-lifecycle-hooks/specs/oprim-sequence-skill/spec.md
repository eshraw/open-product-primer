## ADDED Requirements

### Requirement: oprim-sequence skill SHALL support triage mode when no intention is provided
When invoked without a pre-seeded intention, the skill SHALL read `oprim/sequence.yaml` and the active bets directory, compute board health, and present a ranked list of specific actionable move suggestions before asking the user what to do.

#### Scenario: Triage mode surfaces specific suggestions
- **WHEN** the `oprim-sequence` skill is invoked with no intention
- **THEN** the skill reads `sequence.yaml`, computes WIP utilization, blocked bets, and ready-to-pull bets, and presents at least one specific named suggestion (e.g. "BET-005 is ready for Now — its blocker BET-003 is archived")

#### Scenario: Triage mode reports healthy board
- **WHEN** the `oprim-sequence` skill is invoked and the board has no violations or ready moves
- **THEN** the skill reports the board as healthy with current WIP utilization and offers to move something anyway

#### Scenario: Triage suggestions are specific, not generic
- **WHEN** the skill surfaces a move suggestion
- **THEN** the suggestion names the exact bet ID and lane, and gives the reason (e.g. blocker archived, WIP slot open, PDR met)

### Requirement: oprim-sequence skill SHALL support seeded mode when context is pre-provided
When invoked with lifecycle context already provided (e.g. from a hook), the skill SHALL skip the full board health read and jump directly to the most relevant suggestion for that context.

#### Scenario: Seeded mode targets the relevant move
- **WHEN** the skill is invoked with context "BET-011 was just archived"
- **THEN** the skill surfaces a suggestion about the open Now slot without presenting a full board triage

#### Scenario: Seeded mode falls back to triage if no relevant move exists
- **WHEN** the skill is invoked with lifecycle context but the board has no actionable move related to that context
- **THEN** the skill falls back to triage mode and presents the full board health read

### Requirement: oprim-sequence skill SHALL validate moves before executing
Before writing to `sequence.yaml`, the skill SHALL check that the requested move does not violate WIP limits, unresolved blockers, or missing PDR preconditions.

#### Scenario: Valid move executes with diff preview
- **WHEN** the user confirms a move that passes all constraints
- **THEN** the skill shows the exact YAML change (before/after), asks for confirmation, and writes `sequence.yaml`

#### Scenario: Invalid move is rejected with explanation and alternative
- **WHEN** the user requests a move that would violate a constraint
- **THEN** the skill explains which constraint is violated and suggests the nearest valid alternative

### Requirement: oprim-sequence skill SHALL never silently edit sequence.yaml
Every change to `sequence.yaml` SHALL require the user to confirm after seeing a diff preview. The skill SHALL NOT write changes without explicit confirmation.

#### Scenario: Confirmation required before write
- **WHEN** a valid move is ready to execute
- **THEN** the skill presents the YAML diff and waits for user confirmation before writing
