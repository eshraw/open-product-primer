## Requirements

### Requirement: oprim SHALL provide a native spec-authoring skill producing RFC 2119 + Gherkin capability specs
The system SHALL provide a skill that generates a capability spec containing RFC 2119 (SHALL/SHOULD/MAY) requirements and Gherkin (`#### Scenario` GIVEN/WHEN/THEN) scenarios, and writes it to `oprim/specs/<capability>/spec.md`, without requiring OpenSpec to be installed.

#### Scenario: Generate a native capability spec
- **WHEN** a user invokes the native spec-authoring skill with a capability name and description
- **THEN** the skill writes `oprim/specs/<capability>/spec.md` containing at least one `### Requirement:` with a `SHALL`/`SHOULD`/`MAY` statement and at least one `#### Scenario:` with `WHEN`/`THEN` steps

#### Scenario: Native spec generation works with no OpenSpec installed
- **WHEN** a project has no `openspec/` directory and no OpenSpec CLI available
- **THEN** the native spec-authoring skill still completes successfully and produces a valid spec file

### Requirement: Speccing framework selection SHALL offer a native option alongside OpenSpec and none
`promptFrameworkSelection()` SHALL offer `openspec`, `native`, and `none` as mutually exclusive choices when prompted during `oprim init` or `oprim update`.

#### Scenario: User selects native framework at init
- **WHEN** a user runs `oprim init` and selects `native` at the framework-selection prompt
- **THEN** no OpenSpec scaffolding is installed and the project is configured to use native spec authoring

#### Scenario: User selects none
- **WHEN** a user selects `none` at the framework-selection prompt
- **THEN** neither OpenSpec scaffolding nor native spec-authoring skills are installed

### Requirement: The selected speccing framework SHALL be persisted in oprim/config.yaml
The system SHALL persist the selected framework as `integrations.spec_framework` (`openspec` | `native` | `none`) in `oprim/config.yaml`, readable by any agent and by `oprim doctor`, in addition to any Claude-specific hooks configuration.

#### Scenario: Framework persisted after init
- **WHEN** `oprim init` completes with a framework selection
- **THEN** `oprim/config.yaml` contains `integrations.spec_framework` set to the selected value

#### Scenario: Framework persisted after update
- **WHEN** `oprim update` runs on a project with an existing `oprim/config.yaml` lacking `integrations.spec_framework`
- **THEN** the key is added with the currently-active framework value, and no other existing config values are changed

#### Scenario: Non-Claude agent reads the framework selection
- **WHEN** a non-Claude agent or `oprim doctor` inspects `oprim/config.yaml`
- **THEN** the selected speccing framework is discoverable from `integrations.spec_framework` without reading any Claude-specific files
