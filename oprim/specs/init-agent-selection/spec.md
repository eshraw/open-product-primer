## Requirements

### Requirement: oprim init SHALL prompt the user to select which AI agents to install skills for
During `oprim init`, after scaffolding the `oprim/` workspace, the system SHALL present an interactive multi-select prompt listing supported AI tools (Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, Qwen Code, Kimi CLI) and install `/oprim:*` skills and instructions for each selected tool.

#### Scenario: User selects Claude Code only
- **WHEN** the user runs `oprim init` interactively and selects only Claude Code
- **THEN** the command installs `/oprim:*` skills and commands into `.claude/skills/` and `.claude/commands/oprim/` and writes `agents: [claude]` to `oprim/config.yaml`

#### Scenario: User selects both Claude Code and Cursor
- **WHEN** the user selects both Claude Code and Cursor during `oprim init`
- **THEN** the command installs skills and commands into both `.claude/` and `.cursor/` directories and writes `agents: [claude, cursor]` to `oprim/config.yaml`

#### Scenario: User selects Codex
- **WHEN** the user selects Codex during `oprim init`
- **THEN** the command installs oprim workflow instructions into `AGENTS.md` and writes `agents: [codex]` (or appends `codex` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects Gemini CLI
- **WHEN** the user selects Gemini CLI during `oprim init`
- **THEN** the command installs oprim workflow instructions into `GEMINI.md` and writes `agents: [gemini]` (or appends `gemini` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects Poolside
- **WHEN** the user selects Poolside during `oprim init`
- **THEN** the command creates `.poolside/` if absent, writes six skill files to `.poolside/skills/`, writes an oprim section to `AGENTS.md`, and writes `agents: [poolside]` (or appends `poolside` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects Mistral Vibe
- **WHEN** the user selects Mistral Vibe during `oprim init`
- **THEN** the command creates `.vibe/` if absent, writes oprim skill files to `.vibe/skills/`, writes an oprim section to `AGENTS.md`, and writes `agents: [vibe]` (or appends `vibe` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects Qwen Code
- **WHEN** the user selects Qwen Code during `oprim init`
- **THEN** the command creates `.qwen/` if absent, writes oprim skill files to `.qwen/skills/`, writes an oprim section to `AGENTS.md`, and writes `agents: [qwen]` (or appends `qwen` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects Kimi CLI
- **WHEN** the user selects Kimi CLI during `oprim init`
- **THEN** the command creates `.kimi/` if absent, writes oprim skill files to `.skills/` (not `.kimi/skills/`), writes an oprim section to `AGENTS.md`, and writes `agents: [kimi]` (or appends `kimi` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects all eight agents
- **WHEN** the user selects Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, Qwen Code, and Kimi CLI during `oprim init`
- **THEN** the command installs for all eight agents and writes `agents: [claude, cursor, codex, gemini, poolside, vibe, qwen, kimi]` to `oprim/config.yaml`

#### Scenario: User selects none
- **WHEN** the user deselects all options during `oprim init`
- **THEN** no skill files are written, `agents: []` is stored in `oprim/config.yaml`, and the command suggests running `oprim update` later to install for a specific agent

#### Scenario: Re-running init on an existing project with agents already configured
- **WHEN** `oprim/config.yaml` already contains a non-empty `agents:` list and the user re-runs `oprim init`
- **THEN** the command re-installs skills for the already-configured agents without re-prompting, preserving the existing selection

### Requirement: oprim init SHALL support a --agent flag for non-interactive agent selection
The system SHALL accept one or more `--agent <name>` flags on `oprim init` to specify agent targets without an interactive prompt, enabling use in CI and scripting contexts. Valid agent names are: `claude`, `cursor`, `codex`, `gemini`, `poolside`, `vibe`, `qwen`, `kimi`.

#### Scenario: Non-interactive init with --agent flag for Claude
- **WHEN** the user runs `oprim init --agent claude`
- **THEN** the command scaffolds `oprim/`, writes `agents: [claude]` to config, installs Claude skills and commands, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Codex
- **WHEN** the user runs `oprim init --agent codex`
- **THEN** the command scaffolds `oprim/`, writes `agents: [codex]` to config, installs Codex instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Gemini CLI
- **WHEN** the user runs `oprim init --agent gemini`
- **THEN** the command scaffolds `oprim/`, writes `agents: [gemini]` to config, installs Gemini CLI instructions into `GEMINI.md`, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Poolside
- **WHEN** the user runs `oprim init --agent poolside`
- **THEN** the command scaffolds `oprim/`, writes `agents: [poolside]` to config, creates `.poolside/` if absent, installs Poolside skills into `.poolside/skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Mistral Vibe
- **WHEN** the user runs `oprim init --agent vibe`
- **THEN** the command scaffolds `oprim/`, writes `agents: [vibe]` to config, creates `.vibe/` if absent, installs Vibe skills into `.vibe/skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Qwen Code
- **WHEN** the user runs `oprim init --agent qwen`
- **THEN** the command scaffolds `oprim/`, writes `agents: [qwen]` to config, creates `.qwen/` if absent, installs Qwen Code skills into `.qwen/skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Non-interactive init with --agent flag for Kimi CLI
- **WHEN** the user runs `oprim init --agent kimi`
- **THEN** the command scaffolds `oprim/`, writes `agents: [kimi]` to config, creates `.kimi/` if absent, installs Kimi CLI skills into `.skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Multiple --agent flags
- **WHEN** the user runs `oprim init --agent claude --agent codex`
- **THEN** both agents are installed and written to config

#### Scenario: Unknown agent name in --agent flag
- **WHEN** the user runs `oprim init --agent unknown-tool`
- **THEN** the command exits with a non-zero code and reports the supported agent names: `claude`, `cursor`, `codex`, `gemini`, `poolside`, `vibe`, `qwen`, `kimi`

### Requirement: oprim init SHALL create agent config directories if they do not exist
When installing skills for a selected agent whose config directory (`.claude/` or `.cursor/`) does not yet exist, the system SHALL create the necessary directories before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: Install Claude skills when .claude/ does not exist
- **WHEN** the user selects Claude Code but `.claude/` is absent
- **THEN** the command creates `.claude/skills/` and `.claude/commands/oprim/`, writes the skill files, and prints a notice that `.claude/` was created

### Requirement: oprim init SHALL auto-detect and pre-check known AI agent environments
During `oprim init`, when `AGENTS.md` is present the Codex option SHALL be pre-checked; when `GEMINI.md` is present the Gemini CLI option SHALL be pre-checked; when `.poolside/` is present the Poolside option SHALL be pre-checked; when `.vibe/` is present the Mistral Vibe option SHALL be pre-checked; when `.qwen/` is present the Qwen Code option SHALL be pre-checked; when `.kimi/` is present the Kimi CLI option SHALL be pre-checked.

#### Scenario: AGENTS.md detected at project root
- **WHEN** `AGENTS.md` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Codex pre-checked
- **AND** the CLI prints a dim message: `Auto-detected AI tool environments: codex`

#### Scenario: GEMINI.md detected at project root
- **WHEN** `GEMINI.md` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Gemini CLI pre-checked
- **AND** the CLI prints a dim message that includes `gemini` in the detected list

#### Scenario: .poolside/ directory detected at project root
- **WHEN** `.poolside/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Poolside pre-checked
- **AND** the CLI prints a dim message that includes `poolside` in the detected list

#### Scenario: .vibe/ directory detected at project root
- **WHEN** `.vibe/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Mistral Vibe pre-checked
- **AND** the CLI prints a dim message that includes `vibe` in the detected list

#### Scenario: .qwen/ directory detected at project root
- **WHEN** `.qwen/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Qwen Code pre-checked
- **AND** the CLI prints a dim message that includes `qwen` in the detected list

#### Scenario: .kimi/ directory detected at project root
- **WHEN** `.kimi/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Kimi CLI pre-checked
- **AND** the CLI prints a dim message that includes `kimi` in the detected list

### Requirement: The agents selection SHALL be persisted to oprim/config.yaml
The system SHALL write the selected agents as a YAML list under the `agents:` key in `oprim/config.yaml` so that subsequent `oprim update` and `oprim doctor` runs can use the declared selection.

#### Scenario: agents field written on first init
- **WHEN** `oprim init` completes with one or more agents selected
- **THEN** `oprim/config.yaml` contains `agents:` with the selected agent identifiers

#### Scenario: agents field preserved on re-init when unchanged
- **WHEN** `oprim init` is re-run on a project with an existing `agents:` list
- **THEN** the `agents:` value in config is not cleared or overwritten beyond what the re-install requires
