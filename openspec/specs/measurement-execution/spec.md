## ADDED Requirements

### Requirement: The system SHALL execute Amplitude measurement definitions and return actuals
For each `amplitude-<metric_id>.json` in `primer/bets/BET-NNN/measurements/`, the system SHALL call the Amplitude Chart API using `AMPLITUDE_API_KEY` from the environment and return the computed actual value.

#### Scenario: Execute a funnel measurement against Amplitude
- **WHEN** `oprim measure BET-NNN` is run with valid `AMPLITUDE_API_KEY` and a `amplitude-<id>.json` definition with `chart_type: funnel`
- **THEN** the system calls the Amplitude API, receives the funnel conversion rate, and records it as the `actual` for that metric

#### Scenario: Missing AMPLITUDE_API_KEY
- **WHEN** `AMPLITUDE_API_KEY` is not set and at least one metric has `source.type: amplitude`
- **THEN** the command reports which metrics were skipped and sets their status to `pending` in the run result

#### Scenario: Amplitude API error
- **WHEN** the Amplitude API returns a non-2xx response
- **THEN** the command records the metric status as `pending`, logs the error response, and continues to the next metric

### Requirement: The system SHALL execute BigQuery measurement definitions and return actuals
For each `bigquery-<metric_id>.sql` in `primer/bets/BET-NNN/measurements/`, the system SHALL run the SQL against BigQuery using `GOOGLE_APPLICATION_CREDENTIALS` from the environment and return the first-row scalar result as the actual value.

#### Scenario: Execute a BigQuery sum query
- **WHEN** `oprim measure BET-NNN` is run with valid BigQuery credentials and a `bigquery-<id>.sql` file
- **THEN** the system submits the job, polls until complete, reads the first-row first-column scalar, and records it as the `actual`

#### Scenario: Missing GOOGLE_APPLICATION_CREDENTIALS
- **WHEN** `GOOGLE_APPLICATION_CREDENTIALS` is not set and at least one metric has `source.type: bigquery`
- **THEN** the command reports which metrics were skipped and sets their status to `pending` in the run result

#### Scenario: BigQuery job failure
- **WHEN** the BigQuery job fails or returns zero rows
- **THEN** the command records the metric status as `pending`, logs the error, and continues to the next metric

### Requirement: The system SHALL write a run result file after execution
After executing all metrics, the system SHALL write `primer/bets/BET-NNN/measurements/run-YYYY-MM-DD.yaml` containing bet ID, run date, and per-metric results with actual, status, source, and optional notes.

#### Scenario: Write run result with mixed outcomes
- **WHEN** execution completes with some metrics hitting target and some missing
- **THEN** `run-YYYY-MM-DD.yaml` contains an entry for every metric in `criteria.yaml` with correct `status` values: `hit` (actual ≥ target), `missed` (actual < target), or `pending` (no actual available)

#### Scenario: Overwrite existing run result for same date
- **WHEN** a run result file for today's date already exists
- **THEN** the command overwrites it with the new results

### Requirement: The system SHALL support --dry-run to generate definitions without executing
When `--dry-run` is passed, the system SHALL generate measurement definition files and exit without calling any external API.

#### Scenario: Dry run skips API calls
- **WHEN** `oprim measure BET-NNN --dry-run` is run
- **THEN** definition files are written to `measurements/` but no API calls are made and no `run-*.yaml` is written

### Requirement: The system SHALL execute metrics sequentially, not in parallel
To avoid burst rate-limit failures, the system SHALL run one metric query at a time, waiting for each to complete before starting the next.

#### Scenario: Sequential execution order
- **WHEN** `criteria.yaml` contains three metrics
- **THEN** the second metric's API call is not initiated until the first has completed or errored
