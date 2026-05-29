## MODIFIED Requirements

### Requirement: Project initialization SHALL scaffold a complete oprim workspace
The system SHALL provide `oprim init` that creates a project-local workspace under `oprim/` with config, sequencing file, decision/bet/review directories, and starter templates.

#### Scenario: Initialize oprim in a new repository
- **WHEN** a user runs `oprim init` at the repository root
- **THEN** the command creates `oprim/config.yaml`, `oprim/sequence.yaml`, `oprim/decisions/`, `oprim/bets/`, `oprim/reviews/`, and `oprim/templates/` with default starter files
- **AND** no `primer/` directory is created

#### Scenario: Re-run init on an existing oprim project
- **WHEN** a user runs `oprim init` in a repository that already contains `oprim/` artifacts
- **THEN** the command completes successfully and preserves existing user-authored content under `oprim/`

### Requirement: Initialization SHALL detect OpenSpec and Graphify integrations and write config to oprim/
The system SHALL detect optional OpenSpec and Graphify installations during init and SHALL write integration settings to `oprim/config.yaml`.

#### Scenario: Init in repository with OpenSpec present
- **WHEN** `openspec/` exists and the user runs `oprim init`
- **THEN** `oprim/config.yaml` enables OpenSpec integration with the detected changes directory

#### Scenario: Init in repository without Graphify output
- **WHEN** `graphify-out/` does not exist and the user runs `oprim init`
- **THEN** initialization succeeds with Graphify integration disabled in `oprim/config.yaml`

### Requirement: Doctor SHALL validate oprim/ scaffold
The system SHALL check for the presence of `oprim/`, `oprim/decisions/`, `oprim/bets/`, `oprim/reviews/`, `oprim/templates/`, `oprim/config.yaml`, and `oprim/sequence.yaml` when reporting install health.

#### Scenario: Run health check after init
- **WHEN** a user runs `oprim doctor` after initialization
- **THEN** the command reports pass/fail for the `oprim/` scaffold, config version, and detected integrations

#### Scenario: Doctor detects legacy primer/ directory
- **WHEN** `primer/` exists in the project root but `oprim/` does not
- **THEN** `oprim doctor` reports a failure: "primer/ detected — run `oprim migrate` to rename to oprim/"
