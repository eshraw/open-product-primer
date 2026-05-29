## MODIFIED Requirements

### Requirement: The system SHALL provide the oprim-criteria skill to create criteria contracts
The system SHALL provide the `oprim-criteria` skill that creates or appends to `primer/bets/BET-NNN/criteria.yaml`, populating metric definitions with source mapping for Amplitude or BigQuery.

#### Scenario: Create criteria contract for an existing bet
- **WHEN** a user invokes the `oprim-criteria` skill with a bet ID and provides metric name, baseline, target, timeframe, and source type
- **THEN** the skill writes `primer/bets/BET-NNN/criteria.yaml` with a valid metric entry including all required fields

#### Scenario: Append a metric to an existing criteria contract
- **WHEN** the `oprim-criteria` skill is invoked for a bet whose `criteria.yaml` already exists
- **THEN** the skill appends the new metric entry to the existing file without overwriting prior metrics

### Requirement: oprim-criteria SHALL support Amplitude and BigQuery source types
The skill SHALL accept `amplitude` or `bigquery` as source types and SHALL emit the correct source mapping structure for each.

#### Scenario: Add an Amplitude-backed metric
- **WHEN** the user specifies source type `amplitude` with an event name and aggregation
- **THEN** the criteria entry contains a valid `source.type: amplitude` block with `event`, `aggregation`, and optional `denominator_event` fields

#### Scenario: Add a BigQuery-backed metric
- **WHEN** the user specifies source type `bigquery` with a table, metric column, filter, and aggregation
- **THEN** the criteria entry contains a valid `source.type: bigquery` block with `table`, `metric_column`, `filter`, and `aggregation` fields

### Requirement: oprim-criteria SHALL validate that the target bet exists
The skill SHALL verify that `primer/bets/BET-NNN/` exists before writing a criteria file.

#### Scenario: Bet directory does not exist
- **WHEN** the user invokes the `oprim-criteria` skill with a BET ID whose directory does not exist in `primer/bets/`
- **THEN** the skill reports that the bet was not found and advises the user to use the `oprim-bet` skill first

## REMOVED Requirements

### Requirement: The system SHALL provide a /oprim:criteria command to create criteria contracts
**Reason**: The `/oprim:criteria` slash command was a thin wrapper that only delegated to the `oprim-criteria` skill with no ergonomic advantage. Removing it eliminates a duplicate entry point.
**Migration**: Use the `oprim-criteria` skill directly via the Skill tool.
