## ADDED Requirements

### Requirement: Open Product Primer SHALL be installable as a global CLI package
The system SHALL provide a globally installable CLI (for example via npm package `@open-product-primer/cli`) that exposes at minimum `init`, `update`, and `doctor` commands for project setup and maintenance.

#### Scenario: Install CLI on developer machine
- **WHEN** a user installs the Open Product Primer CLI globally
- **THEN** the `open-product-primer` command is available in the shell
- **AND** the `oprim` bin alias resolves to the same CLI entrypoint

### Requirement: Project initialization SHALL scaffold a complete primer workspace
The system SHALL provide `open-product-primer init` (alias `oprim init`) that creates a project-local primer workspace with config, sequencing file, decision/bet/review directories, and starter templates.

#### Scenario: Initialize Open Product Primer in a new repository
- **WHEN** a user runs `open-product-primer init` or `oprim init` at the repository root
- **THEN** the command creates `primer/config.yaml`, `primer/sequence.yaml`, `primer/decisions/`, `primer/bets/`, `primer/reviews/`, and `primer/templates/` with default starter files

### Requirement: Initialization SHALL be idempotent and non-destructive
The system SHALL allow repeated `open-product-primer init` runs without deleting existing decision artifacts, bet records, reviews, or user-edited configuration values.

#### Scenario: Re-run init on an existing project
- **WHEN** a user runs `open-product-primer init` in a repository that already contains primer artifacts
- **THEN** the command completes successfully and preserves existing user-authored primer content

### Requirement: Initialization SHALL detect OpenSpec and Graphify integrations
The system SHALL detect optional OpenSpec and Graphify installations during init and SHALL write integration settings in `primer/config.yaml` without requiring those tools to be present.

#### Scenario: Init in repository with OpenSpec present
- **WHEN** `openspec/` exists and the user runs `open-product-primer init`
- **THEN** `primer/config.yaml` enables OpenSpec integration with the detected changes directory

#### Scenario: Init in repository without Graphify output
- **WHEN** `graphify-out/` does not exist and the user runs `open-product-primer init`
- **THEN** initialization succeeds with Graphify integration disabled by default

### Requirement: Update SHALL refresh agent command integrations
The system SHALL provide `open-product-primer update` to refresh assistant-specific slash commands and skills from packaged templates for supported AI tools. When `primer/config.yaml` contains an `agents:` list, update SHALL install for the declared agents; otherwise it SHALL fall back to detecting `.claude/` and `.cursor/` by directory presence.

#### Scenario: Refresh for config-declared agents
- **WHEN** a user runs `open-product-primer update` in a project with `agents: [claude, cursor]` in config
- **THEN** the command updates `/oprim:*` command definitions for both Claude Code and Cursor regardless of which directories were pre-existing

#### Scenario: Refresh Cursor and Claude command files (legacy detection)
- **WHEN** a user runs `open-product-primer update` in an initialized project with no `agents:` in config
- **THEN** the command updates packaged `/oprim:*` command definitions for detected assistant environments

### Requirement: Doctor SHALL validate install health and integration readiness
The system SHALL provide `open-product-primer doctor` that reports scaffold validity, config schema compatibility, optional ecosystem integrations, and optional measurement credentials.

#### Scenario: Run health check after init
- **WHEN** a user runs `open-product-primer doctor` after initialization
- **THEN** the command reports pass/fail status for primer scaffold, config version, and detected OpenSpec/Graphify integrations

### Requirement: Installation documentation SHALL define reproducible setup steps
The system SHALL document a minimal setup path that includes global install, per-project init, doctor validation, and update refresh, comparable to OpenSpec and Graphify onboarding flows. Documentation SHALL use the brand name **Open Product Primer** and refer to the short form **`oprim`** for daily CLI and agent usage.

#### Scenario: Onboard a new project using documented steps
- **WHEN** a new team member follows the installation guide
- **THEN** they can bootstrap an initialized Open Product Primer workspace and verify readiness with `oprim doctor` without manual template copying

### Requirement: oprim update SHALL read agents from primer/config.yaml when present
When `primer/config.yaml` contains a non-empty `agents:` list, `oprim update` SHALL install skills and commands for exactly those agents rather than detecting agent environments by directory presence.

#### Scenario: Update respects config-declared agents
- **WHEN** `primer/config.yaml` contains `agents: [claude]` and only `.cursor/` exists in the project root
- **THEN** `oprim update` installs Claude skills only, ignoring the `.cursor/` directory

#### Scenario: Update falls back to directory detection when agents field is absent
- **WHEN** `primer/config.yaml` exists but has no `agents:` field (legacy project)
- **THEN** `oprim update` detects `.claude/` and `.cursor/` by directory presence and installs for whichever are found

#### Scenario: Update with empty agents list
- **WHEN** `primer/config.yaml` contains `agents: []`
- **THEN** `oprim update` reports that no agents are configured and suggests running `oprim init` to select agents

### Requirement: oprim doctor SHALL validate configured agent environments
When `primer/config.yaml` contains an `agents:` list, `oprim doctor` SHALL check that each declared agent's config directory exists and report a failure for any that are missing.

#### Scenario: Doctor reports missing directory for declared agent
- **WHEN** `primer/config.yaml` declares `agents: [claude]` but `.claude/` does not exist
- **THEN** `oprim doctor` reports a failure: Claude Code environment declared in config but `.claude/` directory not found

#### Scenario: Doctor passes when all declared agent directories exist
- **WHEN** all agents listed in `agents:` have their config directories present
- **THEN** `oprim doctor` reports a pass for the agent environment check

#### Scenario: Doctor skips agent directory check when agents field is absent
- **WHEN** `primer/config.yaml` has no `agents:` field
- **THEN** `oprim doctor` does not report failures for missing agent directories (legacy detection-based behavior)
