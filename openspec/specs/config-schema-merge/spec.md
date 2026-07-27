## Requirements

### Requirement: oprim/config.yaml SHALL support a context block and per-artifact rules
The system SHALL support a `context:` free-text field and a `rules:` object with optional per-artifact keys (`bet`, `pdr`, `spec`, `review`) in `oprim/config.yaml`. Both SHALL default to empty when not set by the user.

#### Scenario: Context and rules present in a fresh init
- **WHEN** a user runs `oprim init`
- **THEN** the generated `oprim/config.yaml` includes an empty `context:` field and an empty `rules:` object

#### Scenario: Generated bet content honors rules.bet
- **WHEN** `oprim/config.yaml` has a non-empty `rules.bet` value and a user creates a new bet
- **THEN** the bet-authoring skill includes that rule's guidance in the generated `bet-decision.md` content

#### Scenario: Empty rules produce unchanged behavior
- **WHEN** `rules:` is empty or absent
- **THEN** bet/PDR/spec/review generation behaves exactly as it did before this capability existed

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
