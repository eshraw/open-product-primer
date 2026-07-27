## Requirements

### Requirement: A project SHALL be able to declare itself a citable remote context
The system SHALL provide `oprim context init`, which writes a `.oprim-context/context.yaml` identity file to the current project root, containing at minimum `name` and `version` fields. This file makes the project resolvable as a remote context by other projects' sources, regardless of whether they reach it over git or by local path.

#### Scenario: Initializing a remote context identity
- **WHEN** a user runs `oprim context init` in a project with an `oprim/` workspace and no existing `.oprim-context/context.yaml`
- **THEN** the system writes `.oprim-context/context.yaml` with the project's declared `name` and a `version` field

#### Scenario: Remote context identity already exists
- **WHEN** a user runs `oprim context init` in a project that already has `.oprim-context/context.yaml`
- **THEN** the system leaves the existing file unchanged and reports that a remote context identity is already present

### Requirement: A remote context identity SHALL carry a canonical self-description
The system SHALL support an optional `--description "<text>"` flag on `oprim context init`, storing the value as a `description` field in `.oprim-context/context.yaml`. This description is the source's own statement of what it contains, authored once by whoever initializes it, and is distinct from any local note a referencing project may separately record at registration time.

#### Scenario: Initializing with a description
- **WHEN** a user runs `oprim context init --description "Acme platform decisions and specs — auth, billing, infra"`
- **THEN** the written `.oprim-context/context.yaml` includes that text as its `description` field

#### Scenario: Initializing without a description
- **WHEN** a user runs `oprim context init` without `--description`
- **THEN** the written `.oprim-context/context.yaml` omits the `description` field (or leaves it empty), and the project remains a valid, resolvable remote context

### Requirement: Remote context identity name SHALL be validated against the referencing source entry, for both git and local-path sources
The system SHALL cross-check a resolved remote context's `.oprim-context/context.yaml` `name` field against the `name` declared in the referencing project's `remote_context.sources` entry, to catch misconfigured or renamed sources. This check applies uniformly whether the source is a `git` source or a `path` source.

#### Scenario: Source name matches resolved identity (git source)
- **WHEN** a project resolves a `git` source whose declared `name` matches the `name` in the target's `.oprim-context/context.yaml`
- **THEN** resolution succeeds with no warning

#### Scenario: Source name matches resolved identity (local-path source)
- **WHEN** a project resolves a `path` source whose declared `name` matches the `name` in the target directory's `.oprim-context/context.yaml`
- **THEN** resolution succeeds with no warning

#### Scenario: Source name does not match resolved identity
- **WHEN** a project resolves a source (git or local path) whose declared `name` does not match the `name` found in the target's `.oprim-context/context.yaml`
- **THEN** the system surfaces a mismatch warning identifying both the declared and resolved names, and resolution still returns the fetched or read content
