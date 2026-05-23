## ADDED Requirements

### Requirement: oprim init SHALL prompt the user to select which AI agents to install skills for
During `oprim init`, after scaffolding the `primer/` workspace, the system SHALL present an interactive multi-select prompt listing supported AI tools (Claude Code, Cursor) and install `/oprim:*` skills and commands for each selected tool.

#### Scenario: User selects Claude Code only
- **WHEN** the user runs `oprim init` interactively and selects only Claude Code
- **THEN** the command installs `/oprim:*` skills and commands into `.claude/skills/` and `.claude/commands/oprim/` and writes `agents: [claude]` to `primer/config.yaml`

#### Scenario: User selects both Claude Code and Cursor
- **WHEN** the user selects both Claude Code and Cursor during `oprim init`
- **THEN** the command installs skills and commands into both `.claude/` and `.cursor/` directories and writes `agents: [claude, cursor]` to `primer/config.yaml`

#### Scenario: User selects none
- **WHEN** the user deselects all options during `oprim init`
- **THEN** no skill files are written, `agents: []` is stored in `primer/config.yaml`, and the command suggests running `oprim update` later to install for a specific agent

#### Scenario: Re-running init on an existing project with agents already configured
- **WHEN** `primer/config.yaml` already contains a non-empty `agents:` list and the user re-runs `oprim init`
- **THEN** the command re-installs skills for the already-configured agents without re-prompting, preserving the existing selection

### Requirement: oprim init SHALL support a --agent flag for non-interactive agent selection
The system SHALL accept one or more `--agent <name>` flags on `oprim init` to specify agent targets without an interactive prompt, enabling use in CI and scripting contexts.

#### Scenario: Non-interactive init with --agent flag
- **WHEN** the user runs `oprim init --agent claude`
- **THEN** the command scaffolds `primer/`, writes `agents: [claude]` to config, installs Claude skills and commands, and exits without displaying a prompt

#### Scenario: Multiple --agent flags
- **WHEN** the user runs `oprim init --agent claude --agent cursor`
- **THEN** both agents are installed and written to config

#### Scenario: Unknown agent name in --agent flag
- **WHEN** the user runs `oprim init --agent unknown-tool`
- **THEN** the command exits with a non-zero code and reports the supported agent names

### Requirement: oprim init SHALL create agent config directories if they do not exist
When installing skills for a selected agent whose config directory (`.claude/` or `.cursor/`) does not yet exist, the system SHALL create the necessary directories before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: Install Claude skills when .claude/ does not exist
- **WHEN** the user selects Claude Code but `.claude/` is absent
- **THEN** the command creates `.claude/skills/` and `.claude/commands/oprim/`, writes the skill files, and prints a notice that `.claude/` was created

### Requirement: The agents selection SHALL be persisted to primer/config.yaml
The system SHALL write the selected agents as a YAML list under the `agents:` key in `primer/config.yaml` so that subsequent `oprim update` and `oprim doctor` runs can use the declared selection.

#### Scenario: agents field written on first init
- **WHEN** `oprim init` completes with one or more agents selected
- **THEN** `primer/config.yaml` contains `agents:` with the selected agent identifiers

#### Scenario: agents field preserved on re-init when unchanged
- **WHEN** `oprim init` is re-run on a project with an existing `agents:` list
- **THEN** the `agents:` value in config is not cleared or overwritten beyond what the re-install requires
