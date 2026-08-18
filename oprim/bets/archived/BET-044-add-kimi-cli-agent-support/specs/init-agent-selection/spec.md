## MODIFIED Requirements

### Requirement: oprim init SHALL prompt the user to select which AI agents to install skills for
During `oprim init`, after scaffolding the `oprim/` workspace, the system SHALL present an interactive multi-select prompt listing supported AI tools (Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, Kimi CLI) and install `/oprim:*` skills and instructions for each selected tool.

#### Scenario: User selects Claude Code only
- **WHEN** the user runs `oprim init` interactively and selects only Claude Code
- **THEN** the command installs `/oprim:*` skills and commands into `.claude/skills/` and `.claude/commands/oprim/` and writes `agents: [claude]` to `oprim/config.yaml`

#### Scenario: User selects Kimi CLI
- **WHEN** the user selects Kimi CLI during `oprim init`
- **THEN** the command creates `.kimi/` if absent, writes oprim skill files to `.skills/` (not `.kimi/skills/`), writes an oprim section to `AGENTS.md`, and writes `agents: [kimi]` (or appends `kimi` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects all supported agents
- **WHEN** the user selects every supported agent, including Kimi CLI, during `oprim init`
- **THEN** the command installs for all of them and `agents:` in `oprim/config.yaml` includes `kimi` alongside every other selected agent

#### Scenario: User selects none
- **WHEN** the user deselects all options during `oprim init`
- **THEN** no skill files are written, `agents: []` is stored in `oprim/config.yaml`, and the command suggests running `oprim update` later to install for a specific agent

#### Scenario: Re-running init on an existing project with agents already configured
- **WHEN** `oprim/config.yaml` already contains a non-empty `agents:` list and the user re-runs `oprim init`
- **THEN** the command re-installs skills for the already-configured agents without re-prompting, preserving the existing selection

### Requirement: oprim init SHALL support a --agent flag for non-interactive agent selection
The system SHALL accept one or more `--agent <name>` flags on `oprim init` to specify agent targets without an interactive prompt, enabling use in CI and scripting contexts. Valid agent names include `kimi` alongside every other supported agent.

#### Scenario: Non-interactive init with --agent flag for Kimi CLI
- **WHEN** the user runs `oprim init --agent kimi`
- **THEN** the command scaffolds `oprim/`, writes `agents: [kimi]` to config, creates `.kimi/` if absent, installs Kimi CLI skills into `.skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Unknown agent name in --agent flag
- **WHEN** the user runs `oprim init --agent unknown-tool`
- **THEN** the command exits with a non-zero code and reports the full list of supported agent names, including `kimi`

### Requirement: oprim init SHALL auto-detect and pre-check known AI agent environments
During `oprim init`, when `AGENTS.md` is present the Codex option SHALL be pre-checked; when `GEMINI.md` is present the Gemini CLI option SHALL be pre-checked; when `.poolside/` is present the Poolside option SHALL be pre-checked; when `.vibe/` is present the Mistral Vibe option SHALL be pre-checked; when `.kimi/` is present the Kimi CLI option SHALL be pre-checked.

#### Scenario: .kimi/ directory detected at project root
- **WHEN** `.kimi/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Kimi CLI pre-checked
- **AND** the CLI prints a dim message that includes `kimi` in the detected list
