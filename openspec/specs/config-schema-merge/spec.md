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

### Requirement: oprim/config.yaml SHALL reserve an inert store key
The system SHALL write a `store: {enabled: false}` key to `oprim/config.yaml`, with no other behavior attached to it in this capability.

#### Scenario: Store key present but inert
- **WHEN** a user runs `oprim init` or `oprim update`
- **THEN** `oprim/config.yaml` contains `store: {enabled: false}` and no store-related command or behavior is triggered by its presence

### Requirement: oprim update SHALL additively merge new config schema keys without altering existing values
`oprim update` SHALL detect schema key paths present in the current template but absent from the project's existing `oprim/config.yaml`, insert each missing key path with its default value, and SHALL NOT modify, reorder, or remove any key path already present in the existing file.

#### Scenario: Update adds missing keys to an old config
- **WHEN** a user runs `oprim update` on a project whose `oprim/config.yaml` predates the `context`/`rules`/`store` keys
- **THEN** the command adds `context: ""`, `rules: {}`, and `store: {enabled: false}` to the file, and every pre-existing key retains its exact prior value

#### Scenario: Update is a no-op when schema is already current
- **WHEN** a user runs `oprim update` on a project whose `oprim/config.yaml` already has all current schema keys
- **THEN** the command makes no changes to `oprim/config.yaml`

#### Scenario: User-set values are never overwritten
- **WHEN** a user has set `context: "TypeScript monorepo"` and runs `oprim update`
- **THEN** `context` remains `"TypeScript monorepo"` after the update, unchanged
