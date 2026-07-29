## ADDED Requirements

### Requirement: Success criteria SHALL be converted into repo-native metric contracts
The system SHALL support storing structured success criteria per bet in a machine-readable contract format that includes metric identity, baseline, target, timeframe, and data source.

#### Scenario: Import criteria during bet promotion
- **WHEN** a user promotes a bet that has structured criteria in Notion
- **THEN** the system writes a criteria contract artifact under the bet directory with the required fields

### Requirement: KPI automation SHALL support Amplitude and BigQuery-backed metrics
The system SHALL generate and run metric definitions for Amplitude event-based measurements and BigQuery-backed calculations, with optional segment filters.

#### Scenario: Generate measurement definitions from criteria contract
- **WHEN** a criteria contract references Amplitude and BigQuery sources
- **THEN** the system outputs runnable measurement definitions for both sources

### Requirement: KPI outcomes SHALL feed decision review artifacts
The system SHALL produce review artifacts that compare baseline, target, and actual values and include explicit decision-quality follow-up actions.

#### Scenario: Write a KPI review after measurement run
- **WHEN** KPI execution completes for a bet
- **THEN** the system writes a review artifact containing metric comparison and recommended updates to bet decisions, PDRs, and sequencing
