## Requirements

### Requirement: oprim context SHALL assemble and print resolved remote context content on demand
The system SHALL provide an `oprim context` command that resolves every entry in `remote_context.sources` (per the remote-context-resolution capability) and prints their assembled oprim content to stdout, on demand only.

#### Scenario: Running context with configured sources
- **WHEN** a user runs `oprim context` in a project with one or more entries in `remote_context.sources`
- **THEN** the command resolves each source and prints its assembled decisions/bets/specs content, labeled by source name

#### Scenario: Running context with no configured sources
- **WHEN** a user runs `oprim context` in a project whose `remote_context.sources` is empty or `remote_context.enabled` is false
- **THEN** the command reports that no remote contexts are configured and exits without error

### Requirement: oprim context SHALL support scoping to a single named source
The system SHALL support a `--source <name>` flag on `oprim context` that limits output to the single matching source, regardless of whether it is a `git` or `path` source.

#### Scenario: Scoping to one source among several
- **WHEN** a user runs `oprim context --source acme-platform` and `remote_context.sources` contains an entry named `acme-platform` among others
- **THEN** the command prints only that source's resolved content

#### Scenario: Scoping to a name with no matching source
- **WHEN** a user runs `oprim context --source <name>` and no entry with that name exists in `remote_context.sources`
- **THEN** the command reports that no matching source was found and exits with a non-zero status

### Requirement: oprim context SHALL never write resolved remote content into agent instruction files
The system SHALL only print resolved remote context to stdout when `oprim context` is invoked; it SHALL NOT write or inject that content into CLAUDE.md, AGENTS.md, or any other standing agent instruction file, whether invoked directly or as part of `oprim update`.

#### Scenario: Running oprim update does not surface remote context
- **WHEN** a user runs `oprim update` in a project with configured `remote_context.sources`
- **THEN** no remote context content is added to CLAUDE.md, AGENTS.md, or any other agent instruction file as a result
