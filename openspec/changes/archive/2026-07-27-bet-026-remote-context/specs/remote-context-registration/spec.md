## ADDED Requirements

### Requirement: oprim context register SHALL add a git source to the current project's config
The system SHALL provide `oprim context register --git <url> --name <name>`, which appends a `{name, git: <url>}` entry to `remote_context.sources` in the current project's `oprim/config.yaml`, and sets `remote_context.enabled` to `true` if it is not already.

#### Scenario: Registering a new git source
- **WHEN** a user runs `oprim context register --git <url> --name <name>` and no existing source with that `name` is present
- **THEN** the system appends `{name, git: <url>}` to `remote_context.sources` and ensures `remote_context.enabled` is `true`

#### Scenario: Registering a git source with a name already in use
- **WHEN** a user runs `oprim context register --git <url> --name <name>` and a source with that `name` already exists in `remote_context.sources`
- **THEN** the system reports a name conflict and does not modify the existing entry or add a duplicate

### Requirement: oprim context register SHALL add a local-path source to the current project's config
The system SHALL provide `oprim context register --local <path> --name <name>`, which appends a `{name, path: <path>}` entry to `remote_context.sources` in the current project's `oprim/config.yaml`, and sets `remote_context.enabled` to `true` if it is not already.

#### Scenario: Registering a new local-path source
- **WHEN** a user runs `oprim context register --local <path> --name <name>` and no existing source with that `name` is present
- **THEN** the system appends `{name, path: <path>}` to `remote_context.sources` and ensures `remote_context.enabled` is `true`

#### Scenario: Registering a local-path source with a name already in use
- **WHEN** a user runs `oprim context register --local <path> --name <name>` and a source with that `name` already exists in `remote_context.sources`
- **THEN** the system reports a name conflict and does not modify the existing entry or add a duplicate

### Requirement: oprim context register SHALL support an optional local description note, distinct from the source's canonical description
The system SHALL support an optional `--description "<text>"` flag on `oprim context register` (for either `--git` or `--local`), storing the value as a `description` field on the new entry in `remote_context.sources`. This is a local annotation authored by the registering project (e.g. why it registered this source) and is stored only in the local config — it SHALL NOT be written to, or override, the source's own canonical `description` in its `.oprim-context/context.yaml`.

#### Scenario: Registering with a local description note
- **WHEN** a user runs `oprim context register --git <url> --name <name> --description "check before infra bets"`
- **THEN** the new `remote_context.sources` entry includes `description: "check before infra bets"` alongside `name` and `git`

#### Scenario: Registering without a local description note
- **WHEN** a user runs `oprim context register --git <url> --name <name>` without `--description`
- **THEN** the new `remote_context.sources` entry omits the `description` field, and the source remains fully valid and resolvable

### Requirement: oprim context register SHALL immediately fetch and display the target's canonical description
The system SHALL, as part of registering a new source (git or local path), perform an identity-only fetch (per the remote-context-resolution capability) of the target immediately after adding the entry, and display the resolved canonical `description` (and any name-mismatch warning) to the user as confirmation — so the user sees what they just registered without a separate `oprim context list` call.

#### Scenario: Registration succeeds and identity-only fetch succeeds
- **WHEN** a user registers a new source and the immediate identity-only fetch succeeds
- **THEN** the command output includes the target's canonical `description` alongside confirmation that the source was registered

#### Scenario: Registration succeeds but identity-only fetch fails
- **WHEN** a user registers a new source (git or local path) and the immediate identity-only fetch fails (unreachable remote, missing path, or no identity file present at the target)
- **THEN** the system still adds the entry to `remote_context.sources`, and the command output clearly warns that the description/identity could not be confirmed yet, suggesting `oprim context list` or `oprim doctor` to retry

#### Scenario: Target has no canonical description
- **WHEN** a user registers a new source and the immediate identity-only fetch succeeds but the target's identity file has no `description` field
- **THEN** the command output confirms registration and notes that the target has no description set, without treating this as a failure

### Requirement: oprim context register SHALL require exactly one of --git or --local
The system SHALL reject invocations of `oprim context register` that specify both `--git` and `--local`, or neither, with a clear usage error.

#### Scenario: Both --git and --local provided
- **WHEN** a user runs `oprim context register --git <url> --local <path> --name <name>`
- **THEN** the system rejects the command with an error stating exactly one of `--git` or `--local` is required

#### Scenario: Neither --git nor --local provided
- **WHEN** a user runs `oprim context register --name <name>` with no `--git` or `--local` flag
- **THEN** the system rejects the command with an error stating exactly one of `--git` or `--local` is required
