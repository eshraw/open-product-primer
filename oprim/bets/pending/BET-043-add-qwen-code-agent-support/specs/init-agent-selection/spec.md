## MODIFIED Requirements

### Requirement: oprim init SHALL prompt the user to select which AI agents to install skills for
During `oprim init`, after scaffolding the `oprim/` workspace, the system SHALL present an interactive multi-select prompt listing supported AI tools (Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, Qwen Code) and install `/oprim:*` skills and instructions for each selected tool.

#### Scenario: User selects Claude Code only
- **WHEN** the user runs `oprim init` interactively and selects only Claude Code
- **THEN** the command installs `/oprim:*` skills and commands into `.claude/skills/` and `.claude/commands/oprim/` and writes `agents: [claude]` to `oprim/config.yaml`

#### Scenario: User selects Qwen Code
- **WHEN** the user selects Qwen Code during `oprim init`
- **THEN** the command creates `.qwen/` if absent, writes oprim skill files to `.qwen/skills/`, writes an oprim section to `AGENTS.md`, and writes `agents: [qwen]` (or appends `qwen` to existing agent list) to `oprim/config.yaml`

#### Scenario: User selects all seven agents
- **WHEN** the user selects Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, and Qwen Code during `oprim init`
- **THEN** the command installs for all seven agents and writes `agents: [claude, cursor, codex, gemini, poolside, vibe, qwen]` to `oprim/config.yaml`

#### Scenario: User selects none
- **WHEN** the user deselects all options during `oprim init`
- **THEN** no skill files are written, `agents: []` is stored in `oprim/config.yaml`, and the command suggests running `oprim update` later to install for a specific agent

#### Scenario: Re-running init on an existing project with agents already configured
- **WHEN** `oprim/config.yaml` already contains a non-empty `agents:` list and the user re-runs `oprim init`
- **THEN** the command re-installs skills for the already-configured agents without re-prompting, preserving the existing selection

### Requirement: oprim init SHALL support a --agent flag for non-interactive agent selection
The system SHALL accept one or more `--agent <name>` flags on `oprim init` to specify agent targets without an interactive prompt, enabling use in CI and scripting contexts. Valid agent names are: `claude`, `cursor`, `codex`, `gemini`, `poolside`, `vibe`, `qwen`.

#### Scenario: Non-interactive init with --agent flag for Qwen Code
- **WHEN** the user runs `oprim init --agent qwen`
- **THEN** the command scaffolds `oprim/`, writes `agents: [qwen]` to config, creates `.qwen/` if absent, installs Qwen Code skills into `.qwen/skills/` and instructions into `AGENTS.md`, and exits without displaying a prompt

#### Scenario: Unknown agent name in --agent flag
- **WHEN** the user runs `oprim init --agent unknown-tool`
- **THEN** the command exits with a non-zero code and reports the supported agent names: `claude`, `cursor`, `codex`, `gemini`, `poolside`, `vibe`, `qwen`

### Requirement: oprim init SHALL auto-detect and pre-check known AI agent environments
During `oprim init`, when `AGENTS.md` is present the Codex option SHALL be pre-checked; when `GEMINI.md` is present the Gemini CLI option SHALL be pre-checked; when `.poolside/` is present the Poolside option SHALL be pre-checked; when `.vibe/` is present the Mistral Vibe option SHALL be pre-checked; when `.qwen/` is present the Qwen Code option SHALL be pre-checked.

#### Scenario: .qwen/ directory detected at project root
- **WHEN** `.qwen/` exists and the user runs `oprim init`
- **THEN** the multi-select prompt shows Qwen Code pre-checked
- **AND** the CLI prints a dim message that includes `qwen` in the detected list
