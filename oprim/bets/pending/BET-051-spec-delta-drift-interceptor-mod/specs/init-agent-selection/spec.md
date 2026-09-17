## MODIFIED Requirements

### Requirement: oprim init SHALL prompt the user to select which AI agents to install skills for
During `oprim init`, after scaffolding the `oprim/` workspace, the system SHALL present an interactive multi-select prompt listing supported AI tools (Claude Code, Cursor, Codex, Gemini CLI, Poolside, Mistral Vibe, Qwen Code, Kimi CLI) and install `/oprim:*` skills and instructions for each selected tool. If Claude Code is among the selected tools, a second multi-select prompt for claude-mods selection SHALL follow (see the `claude-mods` capability).

#### Scenario: User selects Claude Code only
- **WHEN** the user runs `oprim init` interactively and selects only Claude Code
- **THEN** the command installs `/oprim:*` skills and commands into `.claude/skills/` and `.claude/commands/oprim/`, writes `agents: [claude]` to `oprim/config.yaml`, and follows with the claude-mods selection prompt

#### Scenario: User selects both Claude Code and Cursor
- **WHEN** the user selects both Claude Code and Cursor during `oprim init`
- **THEN** the command installs skills and commands into both `.claude/` and `.cursor/` directories, writes `agents: [claude, cursor]` to `oprim/config.yaml`, and follows with the claude-mods selection prompt (Cursor does not trigger its own mods prompt)

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
- **THEN** the command installs for all eight agents, writes `agents: [claude, cursor, codex, gemini, poolside, vibe, qwen, kimi]` to `oprim/config.yaml`, and follows with the claude-mods selection prompt

#### Scenario: User selects none
- **WHEN** the user deselects all options during `oprim init`
- **THEN** no skill files are written, `agents: []` is stored in `oprim/config.yaml`, no claude-mods prompt appears, and the command suggests running `oprim update` later to install for a specific agent

#### Scenario: Re-running init on an existing project with agents already configured
- **WHEN** `oprim/config.yaml` already contains a non-empty `agents:` list and the user re-runs `oprim init`
- **THEN** the command re-installs skills for the already-configured agents without re-prompting, preserving the existing selection; if `claude` is among them, the claude-mods prompt still runs (existing selection, if any, pre-checked)
