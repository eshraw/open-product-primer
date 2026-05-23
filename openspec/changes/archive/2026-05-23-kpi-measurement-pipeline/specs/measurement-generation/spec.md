## ADDED Requirements

### Requirement: The system SHALL generate Amplitude measurement definitions from criteria entries
For each metric in `criteria.yaml` with `source.type: amplitude`, the system SHALL write a JSON measurement definition to `primer/bets/BET-NNN/measurements/amplitude-<metric_id>.json` containing the chart type, events, aggregation, segment filters, and computed date window.

#### Scenario: Generate Amplitude definition for a rate metric
- **WHEN** a metric has `source.type: amplitude`, a `denominator_event`, and a `launch_date`
- **THEN** the output JSON contains `chart_type: funnel`, both events in the `events` array, `aggregation`, and a `window` object with `start` and `end` dates derived from `launch_date` and `timeframe`

#### Scenario: Generate Amplitude definition for an absolute count metric
- **WHEN** a metric has `source.type: amplitude` and `denominator_event: null`
- **THEN** the output JSON contains the single event, the specified aggregation, and the computed date window

#### Scenario: Generate Amplitude definition with segment filter
- **WHEN** a metric has a non-null `segment` field
- **THEN** the output JSON includes the segment value in `segment_filters`

### Requirement: The system SHALL generate BigQuery SQL measurement definitions from criteria entries
For each metric in `criteria.yaml` with `source.type: bigquery`, the system SHALL write a SQL file to `primer/bets/BET-NNN/measurements/bigquery-<metric_id>.sql` with a valid SELECT statement using the configured table, metric column, filter, aggregation, and date window.

#### Scenario: Generate BigQuery SQL for a sum metric
- **WHEN** a metric has `source.type: bigquery` with `aggregation: sum` and a `launch_date`
- **THEN** the output SQL contains `SELECT SUM(<metric_column>)`, a `FROM <table>` clause, a `WHERE` clause combining the configured filter and the date window, and a comment header with baseline, target, and window dates

#### Scenario: Generate BigQuery SQL for a rate metric with denominator
- **WHEN** a metric has `source.type: bigquery` with a non-null `denominator_query`
- **THEN** the output SQL computes a ratio using the denominator subquery

#### Scenario: Generate BigQuery SQL with count_distinct aggregation
- **WHEN** a metric has `aggregation: count_distinct`
- **THEN** the output SQL uses `COUNT(DISTINCT <metric_column>)`

### Requirement: The system SHALL compute the measurement date window from launch_date and timeframe
Given a `launch_date` and `timeframe` string (e.g., `"30 days post-launch"`), the system SHALL parse the integer day count and compute `window.start = launch_date` and `window.end = launch_date + N days`.

#### Scenario: Parse standard timeframe string
- **WHEN** `timeframe` is `"30 days post-launch"` and `launch_date` is `"2024-03-01"`
- **THEN** `window.start` is `"2024-03-01"` and `window.end` is `"2024-03-31"`

#### Scenario: Missing launch_date defers window computation
- **WHEN** `launch_date` is `null` or absent
- **THEN** the generated file omits the `window` field and includes a `// launch_date required` comment

### Requirement: The system SHALL create the measurements directory if it does not exist
The `oprim measure` command SHALL create `primer/bets/BET-NNN/measurements/` before writing any output files.

#### Scenario: measurements directory absent
- **WHEN** `primer/bets/BET-NNN/measurements/` does not exist
- **THEN** the command creates it and proceeds without error

### Requirement: The system SHALL report an error if the bet directory does not exist
The command SHALL validate that `primer/bets/BET-NNN/` exists before attempting generation.

#### Scenario: Unknown bet ID
- **WHEN** `oprim measure` is invoked with a BET ID that has no directory in `primer/bets/`
- **THEN** the command exits with a non-zero code and reports that the bet was not found
