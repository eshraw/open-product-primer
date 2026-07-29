## ADDED Requirements

### Requirement: oprim/config.yaml SHALL support an active remote_context schema
The system SHALL support a `remote_context:` key in `oprim/config.yaml` with an `enabled: boolean` field (default `false`) and a `sources:` list (default empty) of entries, where each entry is either `{name, git}` (a git remote URL) or `{name, path}` (a local filesystem path outside the project), each optionally carrying a local `description` note. This key is distinct from the pre-existing free-text `context: ""` field and is consumed by the remote-context-resolution, oprim-context-command, remote-context-registration, remote-context-listing, and remote-context-doctor-validation capabilities.

#### Scenario: remote_context key present with defaults in a fresh init
- **WHEN** a user runs `oprim init`
- **THEN** the generated `oprim/config.yaml` includes `remote_context: {enabled: false, sources: []}`

#### Scenario: Adding a git source makes it resolvable
- **WHEN** a user adds a `{name, git}` entry to `remote_context.sources` with a valid `name` and `git` URL
- **THEN** that entry becomes resolvable via `oprim context` and validated by `oprim doctor`

#### Scenario: Adding a local-path source makes it resolvable
- **WHEN** a user adds a `{name, path}` entry to `remote_context.sources` with a valid `name` and existing `path`
- **THEN** that entry becomes resolvable via `oprim context` and validated by `oprim doctor`

#### Scenario: Empty sources produce unchanged behavior
- **WHEN** `remote_context.sources` is empty or `remote_context.enabled` is `false`
- **THEN** `oprim context` and `oprim doctor`'s remote-context checks report no configured sources and no other command behavior changes

## REMOVED Requirements

### Requirement: oprim/config.yaml SHALL reserve an inert store key
**Reason**: Superseded by the active `remote_context:` schema above. The `store:` key was deliberately reserved inert by BET-025 pending this bet; this bet gives remote-source behavior a home under `remote_context:` instead of extending `store:`, to avoid reusing OpenSpec's "store" terminology and to keep the schema distinct from the pre-existing free-text `context:` key.
**Migration**: `oprim update`/`oprim init` stop writing the `store:` key going forward. Projects with an existing `store: {enabled: false}` from before this bet keep that key untouched (it is not actively deleted) — it becomes an inert, unused leftover with no behavior attached, same as before. New behavior lives entirely under `remote_context:`.

The system SHALL write a `store: {enabled: false}` key to `oprim/config.yaml`, with no other behavior attached to it in this capability.

#### Scenario: Store key present but inert
- **WHEN** a user runs `oprim init` or `oprim update`
- **THEN** `oprim/config.yaml` contains `store: {enabled: false}` and no store-related command or behavior is triggered by its presence

## MODIFIED Requirements

### Requirement: oprim update SHALL additively merge new config schema keys without altering existing values
`oprim update` SHALL detect schema key paths present in the current template but absent from the project's existing `oprim/config.yaml`, insert each missing key path with its default value, and SHALL NOT modify, reorder, or remove any key path already present in the existing file.

#### Scenario: Update adds missing keys to an old config
- **WHEN** a user runs `oprim update` on a project whose `oprim/config.yaml` predates the `context`/`rules`/`remote_context` keys
- **THEN** the command adds `context: ""`, `rules: {}`, and `remote_context: {enabled: false, sources: []}` to the file, and every pre-existing key retains its exact prior value

#### Scenario: Update adds remote_context to a config with the old inert store key
- **WHEN** a user runs `oprim update` on a project whose `oprim/config.yaml` has the old `store: {enabled: false}` key from before this capability, without `remote_context`
- **THEN** the command adds `remote_context: {enabled: false, sources: []}` and leaves the existing `store:` key exactly as it was, neither modifying nor removing it

#### Scenario: Update is a no-op when schema is already current
- **WHEN** a user runs `oprim update` on a project whose `oprim/config.yaml` already has all current schema keys
- **THEN** the command makes no changes to `oprim/config.yaml`

#### Scenario: User-set values are never overwritten
- **WHEN** a user has set `context: "TypeScript monorepo"` and runs `oprim update`
- **THEN** `context` remains `"TypeScript monorepo"` after the update, unchanged
