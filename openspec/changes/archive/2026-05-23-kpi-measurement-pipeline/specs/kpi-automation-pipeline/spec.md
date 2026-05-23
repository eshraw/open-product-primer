## ADDED Requirements

### Requirement: The system SHALL provide an oprim measure CLI command
The system SHALL expose `oprim measure BET-NNN` as a CLI command that orchestrates measurement generation and execution for the specified bet.

#### Scenario: Full measure run with valid credentials
- **WHEN** `oprim measure BET-NNN` is run with all required environment variables set and a valid `criteria.yaml`
- **THEN** the command generates definition files, executes them against APIs, and writes `measurements/run-YYYY-MM-DD.yaml`

#### Scenario: Dry run generates definitions only
- **WHEN** `oprim measure BET-NNN --dry-run` is run
- **THEN** the command generates definition files and exits without calling any external API or writing a run result

### Requirement: The system SHALL ingest a run result into /oprim:review when one exists
When `/oprim:review BET-NNN` is invoked and a `run-YYYY-MM-DD.yaml` exists for that bet, the system SHALL use the actuals and statuses from the most recent run result to pre-populate the review metric table, bypassing manual entry for those metrics.

#### Scenario: Review pre-populated from run result
- **WHEN** `/oprim:review BET-NNN` is invoked and `measurements/run-YYYY-MM-DD.yaml` exists
- **THEN** the review artifact metric table is populated with baseline and target from `criteria.yaml` and actual and status from the run result, without prompting the user for those values

#### Scenario: Review falls back to manual entry when no run result exists
- **WHEN** `/oprim:review BET-NNN` is invoked and no `run-*.yaml` file exists in `measurements/`
- **THEN** the command prompts the user for actual values for each metric as before

#### Scenario: Review notes the run date when ingesting a run result
- **WHEN** a run result is ingested into a review
- **THEN** the review artifact includes a note indicating the run date of the data source (e.g., "Actuals from run: 2024-04-01")

### Requirement: oprim doctor SHALL validate measurement environment readiness
`oprim doctor` SHALL check for `AMPLITUDE_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS` and report pass/fail based on whether any `criteria.yaml` in `primer/bets/` references those source types.

#### Scenario: Doctor reports missing key for used source type
- **WHEN** at least one bet has a metric with `source.type: amplitude` and `AMPLITUDE_API_KEY` is not set
- **THEN** `oprim doctor` reports a failure for the Amplitude measurement environment check

#### Scenario: Doctor passes when source type is not used
- **WHEN** no bet has a metric with `source.type: amplitude` and `AMPLITUDE_API_KEY` is not set
- **THEN** `oprim doctor` does not report a failure for the Amplitude check
