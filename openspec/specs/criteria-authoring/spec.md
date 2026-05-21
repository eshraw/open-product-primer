## ADDED Requirements

### Requirement: The system SHALL provide a /oprim:criteria command to create criteria contracts
The system SHALL provide an agent command `/oprim:criteria` that creates or appends to `primer/bets/BET-NNN/criteria.yaml`, populating metric definitions with source mapping for Amplitude or BigQuery.

#### Scenario: Create criteria contract for an existing bet
- **WHEN** a user invokes `/oprim:criteria BET-NNN` and provides metric name, baseline, target, timeframe, and source type
- **THEN** the command writes `primer/bets/BET-NNN/criteria.yaml` with a valid metric entry including all required fields

#### Scenario: Append a metric to an existing criteria contract
- **WHEN** `/oprim:criteria BET-NNN` is invoked and `criteria.yaml` already exists for that bet
- **THEN** the command appends the new metric entry to the existing file without overwriting prior metrics

### Requirement: /oprim:criteria SHALL support Amplitude and BigQuery source types
The command SHALL accept `amplitude` or `bigquery` as source types and SHALL emit the correct source mapping structure for each.

#### Scenario: Add an Amplitude-backed metric
- **WHEN** the user specifies source type `amplitude` with an event name and aggregation
- **THEN** the criteria entry contains a valid `source.type: amplitude` block with `event`, `aggregation`, and optional `denominator_event` fields

#### Scenario: Add a BigQuery-backed metric
- **WHEN** the user specifies source type `bigquery` with a table, metric column, filter, and aggregation
- **THEN** the criteria entry contains a valid `source.type: bigquery` block with `table`, `metric_column`, `filter`, and `aggregation` fields

### Requirement: /oprim:criteria SHALL validate that the target bet exists
The command SHALL verify that `primer/bets/BET-NNN/` exists before writing a criteria file.

#### Scenario: Bet directory does not exist
- **WHEN** the user invokes `/oprim:criteria` with a BET ID whose directory does not exist in `primer/bets/`
- **THEN** the command reports that the bet was not found and advises the user to run `/oprim:bet` first
