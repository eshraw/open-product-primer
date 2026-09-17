## ADDED Requirements

### Requirement: The system SHALL maintain a static registry of installable claude mods
The system SHALL maintain a registry of function-hook-based "claude mods," each entry carrying an id, title, description, and the hook file(s) it installs. Both `oprim init`'s mod-selection prompt and the `oprim claude-mods` command SHALL read from this single registry.

#### Scenario: Registry seeded with the spec-delta-drift interceptor
- **WHEN** the registry is read
- **THEN** it contains at least one entry for the spec-delta-drift interceptor mod (id, title, description, hook file)

### Requirement: oprim init SHALL prompt for mod selection when Claude Code is chosen as an agent
When the user selects Claude Code during `oprim init`'s agent-selection prompt, the system SHALL present a second interactive multi-select prompt listing the mods in the registry, allowing the user to select zero to many.

#### Scenario: Claude Code selected, mods prompt appears
- **WHEN** the user selects Claude Code during `oprim init`
- **THEN** a second multi-select prompt appears listing all registered mods, none pre-checked

#### Scenario: Claude Code not selected, mods prompt is skipped
- **WHEN** the user does not select Claude Code during `oprim init`
- **THEN** no mods prompt appears and `claude_mods:` is not written to `oprim/config.yaml`

#### Scenario: User selects zero mods
- **WHEN** the user deselects all options on the mods prompt
- **THEN** no hook files are installed and `oprim/config.yaml` stores `claude_mods: []`

### Requirement: oprim claude-mods SHALL let an existing install select mods interactively
The system SHALL provide an `oprim claude-mods` command that opens the same mod-selection multi-select prompt for a project with an existing Claude Code install, pre-checking mods already selected per `oprim/config.yaml`'s `claude_mods:` list.

#### Scenario: Running claude-mods on a project with no mods installed
- **WHEN** the user runs `oprim claude-mods` on a project with `claude_mods: []` (or the key absent)
- **THEN** the prompt lists all registered mods with none pre-checked

#### Scenario: Running claude-mods on a project with mods already installed
- **WHEN** the user runs `oprim claude-mods` on a project with `claude_mods: [spec-delta-drift-interceptor]`
- **THEN** the prompt pre-checks the spec-delta-drift interceptor option

#### Scenario: Adding a mod via claude-mods
- **WHEN** the user selects an additional mod not previously installed and confirms
- **THEN** that mod's hook file(s) are merged into `.claude/settings.json` and its id is added to `claude_mods:` in `oprim/config.yaml`

#### Scenario: Removing a mod via claude-mods
- **WHEN** the user deselects a previously-installed mod and confirms
- **THEN** that mod's hook entries are removed from `.claude/settings.json` without touching hooks owned by other mods or by other oprim features, and its id is removed from `claude_mods:`

#### Scenario: Selecting zero mods via claude-mods
- **WHEN** the user deselects every mod (including ones previously installed) and confirms
- **THEN** all mod hook entries are removed from `.claude/settings.json` and `claude_mods: []` is written

#### Scenario: Running claude-mods without a Claude Code install
- **WHEN** the user runs `oprim claude-mods` on a project where `claude` is not in `oprim/config.yaml`'s `agents:` list
- **THEN** the command exits with a non-zero code and a clear error stating Claude Code is not installed, instead of silently doing nothing

### Requirement: The system SHALL detect whether CLAUDE_CODE_ENABLE_FUNCTION_HOOKS is active before installing a mod
When the user selects at least one mod (via `oprim init`'s second prompt or `oprim claude-mods`) and confirms, the system SHALL check whether `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is already active — either as a process environment variable or under an `env` key in `.claude/settings.json`. If it is already active, the system SHALL proceed to install the selected mod(s) without further prompting on this point.

#### Scenario: Function hooks already active
- **GIVEN** `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is already set (env var or `.claude/settings.json` `env` key)
- **WHEN** the user selects one or more mods and confirms
- **THEN** the selected mods' hooks are installed with no activation prompt shown

### Requirement: The system SHALL offer to activate CLAUDE_CODE_ENABLE_FUNCTION_HOOKS on first mod selection
If the user selects at least one mod and `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not yet active, the system SHALL ask a yes/no question: enable it now by writing `env.CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: "1"` into `.claude/settings.json` (merged, non-destructive). If the user answers no, the system SHALL still install the selected mod(s)' hook config (so it's ready once activated) but SHALL print manual activation instructions: set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1` in the shell environment, or add an `env` block with that key to `.claude/settings.json` by hand — and note that selected mods will no-op (per the interceptor's graceful-degradation requirement) until one of those is done.

#### Scenario: User accepts auto-activation
- **GIVEN** `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not active and the user has selected at least one mod
- **WHEN** the system asks "Enable Claude Code function hooks now? (y/n)" and the user answers yes
- **THEN** `.claude/settings.json` gains an `env` block with `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS: "1"`, merged without disturbing existing `hooks` or other settings

#### Scenario: User declines auto-activation
- **GIVEN** `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not active and the user has selected at least one mod
- **WHEN** the system asks "Enable Claude Code function hooks now? (y/n)" and the user answers no
- **THEN** the selected mod(s)' hook config is still installed, `.claude/settings.json` is not modified with the `env` key, and the command prints manual steps to set `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` (shell env var or `.claude/settings.json` `env` block) along with a note that the mod(s) will no-op until activated

#### Scenario: Activation prompt skipped when zero mods selected
- **WHEN** the user selects zero mods and confirms
- **THEN** no activation y/n prompt appears, since there is nothing that depends on the flag

### Requirement: Mod hook merges SHALL NOT clobber existing .claude/settings.json content
Installing or removing a mod's hooks in `.claude/settings.json` SHALL only add or remove that mod's own hook entries, using the same non-destructive merge convention as the existing archive co-archival hook registration.

#### Scenario: Installing a mod alongside existing unrelated hooks
- **GIVEN** `.claude/settings.json` already registers the `on-prompt-submit.sh`/`on-stop.sh` hooks
- **WHEN** a mod is installed via `oprim init` or `oprim claude-mods`
- **THEN** the existing hook entries remain unchanged and the mod's hook entries are added alongside them
