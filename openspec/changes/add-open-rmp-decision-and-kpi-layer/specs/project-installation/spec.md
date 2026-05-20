## ADDED Requirements

### Requirement: open-rmp SHALL be installable as a global CLI package
The system SHALL provide a globally installable CLI (for example via npm) that exposes at minimum `init`, `update`, and `doctor` commands for project setup and maintenance.

#### Scenario: Install CLI on developer machine
- **WHEN** a user installs the open-rmp CLI globally
- **THEN** the `open-rmp` command is available in the shell

### Requirement: Project initialization SHALL scaffold a complete roadmap workspace
The system SHALL provide `open-rmp init` that creates a project-local roadmap workspace with config, sequencing file, decision/bet/review directories, and starter templates.

#### Scenario: Initialize open-rmp in a new repository
- **WHEN** a user runs `open-rmp init` at the repository root
- **THEN** the command creates `roadmap/config.yaml`, `roadmap/sequence.yaml`, `roadmap/decisions/`, `roadmap/bets/`, `roadmap/reviews/`, and `roadmap/templates/` with default starter files

### Requirement: Initialization SHALL be idempotent and non-destructive
The system SHALL allow repeated `open-rmp init` runs without deleting existing decision artifacts, bet records, reviews, or user-edited configuration values.

#### Scenario: Re-run init on an existing project
- **WHEN** a user runs `open-rmp init` in a repository that already contains roadmap artifacts
- **THEN** the command completes successfully and preserves existing user-authored roadmap content

### Requirement: Initialization SHALL detect OpenSpec and Graphify integrations
The system SHALL detect optional OpenSpec and Graphify installations during init and SHALL write integration settings in `roadmap/config.yaml` without requiring those tools to be present.

#### Scenario: Init in repository with OpenSpec present
- **WHEN** `openspec/` exists and the user runs `open-rmp init`
- **THEN** `roadmap/config.yaml` enables OpenSpec integration with the detected changes directory

#### Scenario: Init in repository without Graphify output
- **WHEN** `graphify-out/` does not exist and the user runs `open-rmp init`
- **THEN** initialization succeeds with Graphify integration disabled by default

### Requirement: Update SHALL refresh agent command integrations
The system SHALL provide `open-rmp update` to refresh assistant-specific slash commands and skills from packaged templates for supported AI tools.

#### Scenario: Refresh Cursor and Claude command files
- **WHEN** a user runs `open-rmp update` in an initialized project
- **THEN** the command updates packaged `/rmp:*` command definitions for detected assistant environments

### Requirement: Doctor SHALL validate install health and integration readiness
The system SHALL provide `open-rmp doctor` that reports scaffold validity, config schema compatibility, optional ecosystem integrations, and optional measurement credentials.

#### Scenario: Run health check after init
- **WHEN** a user runs `open-rmp doctor` after initialization
- **THEN** the command reports pass/fail status for roadmap scaffold, config version, and detected OpenSpec/Graphify integrations

### Requirement: Installation documentation SHALL define reproducible setup steps
The system SHALL document a minimal setup path that includes global install, per-project init, doctor validation, and update refresh, comparable to OpenSpec and Graphify onboarding flows.

#### Scenario: Onboard a new project using documented steps
- **WHEN** a new team member follows the installation guide
- **THEN** they can bootstrap an initialized open-rmp workspace and verify readiness with `open-rmp doctor` without manual template copying
