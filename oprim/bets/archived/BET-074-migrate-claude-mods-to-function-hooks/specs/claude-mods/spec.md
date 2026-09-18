## MODIFIED Requirements

### Requirement: The system SHALL maintain a static registry of installable claude mods
The system SHALL maintain a registry of "claude mods," each entry carrying an id, title, description, and either a classic `ClaudeModHookFile` (shell-command hook) or a plugin shape (manifest + `hooks.json`, optionally including a `$.ui`-based hooks module). Both `oprim init`'s mod-selection prompt and the `oprim claude-mods` command SHALL read from this single registry regardless of which shape an entry declares.

#### Scenario: Registry seeded with the spec-delta-drift interceptor
- **WHEN** the registry is read
- **THEN** it contains at least one entry for the spec-delta-drift interceptor mod (id, title, description, and its hook shape)

#### Scenario: Registry supports a plugin-shaped entry
- **WHEN** a registry entry declares a plugin shape (manifest + `hooks.json`) instead of a classic `ClaudeModHookFile`
- **THEN** the mod-selection prompt and `oprim claude-mods` list it the same as any classic-shaped entry, with no special-casing visible to the user

## ADDED Requirements

### Requirement: Installing a plugin-shaped mod SHALL target the Claude Code plugin engine
When a selected registry entry declares a plugin shape, the system SHALL install it by writing its manifest and `hooks.json` (and any `$.ui`-based hooks module) into the project's plugin directory, rather than merging a shell-command hook into `.claude/settings.json`'s `hooks` block.

#### Scenario: Installing a plugin-shaped mod
- **GIVEN** a registry entry declares a plugin shape
- **WHEN** the user selects it via `oprim init` or `oprim claude-mods` and confirms
- **THEN** its manifest, `hooks.json`, and any `$.ui` hooks module are written into the project's plugin directory, and `.claude/settings.json`'s `hooks` block is not modified for this mod

#### Scenario: Removing a plugin-shaped mod
- **WHEN** the user deselects a previously-installed plugin-shaped mod via `oprim claude-mods` and confirms
- **THEN** only that mod's plugin directory contents are removed, leaving other mods' plugin directories, other mods' classic hook entries, and oprim's own `on-prompt-submit.sh`/`on-stop.sh` hooks untouched

#### Scenario: Classic-shaped mods are unaffected
- **WHEN** a registry entry still declares the classic `ClaudeModHookFile` shape
- **THEN** it continues to install and uninstall via the existing `.claude/settings.json` merge path, unchanged
