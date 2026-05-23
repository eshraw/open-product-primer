## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Update SHALL refresh agent command integrations
The system SHALL provide `open-product-primer update` to refresh assistant-specific slash commands and skills from packaged templates for supported AI tools. When `primer/config.yaml` contains an `agents:` list, update SHALL install for the declared agents; otherwise it SHALL fall back to detecting `.claude/` and `.cursor/` by directory presence.

#### Scenario: Refresh for config-declared agents
- **WHEN** a user runs `open-product-primer update` in a project with `agents: [claude, cursor]` in config
- **THEN** the command updates `/oprim:*` command definitions for both Claude Code and Cursor regardless of which directories were pre-existing

#### Scenario: Refresh Cursor and Claude command files (legacy detection)
- **WHEN** a user runs `open-product-primer update` in an initialized project with no `agents:` in config
- **THEN** the command updates packaged `/oprim:*` command definitions for detected assistant environments
