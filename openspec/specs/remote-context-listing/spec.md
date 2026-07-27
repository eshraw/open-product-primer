## Requirements

### Requirement: oprim context list SHALL summarize every registered source without fully resolving any of them
The system SHALL provide `oprim context list`, which prints, for every entry in `remote_context.sources`: `name`, source kind (`git` or `path`), the canonical `description` (resolved from the source's own `.oprim-context/context.yaml` via an identity-only fetch), and the local `description` note (if set on the source entry in the current project's own config). This command SHALL NOT perform a full resolution of any source's oprim workspace.

#### Scenario: Listing sources with descriptions
- **WHEN** a user runs `oprim context list` in a project with multiple configured sources that each have a canonical description
- **THEN** the command prints each source's name, kind, canonical description, and local note (if any) using only identity-only fetches, without pulling any source's full oprim workspace

#### Scenario: Listing a source with no configured sources
- **WHEN** a user runs `oprim context list` in a project whose `remote_context.sources` is empty or `remote_context.enabled` is false
- **THEN** the command reports that no remote contexts are configured and exits without error

#### Scenario: Listing a source with no canonical description
- **WHEN** a user runs `oprim context list` and a source's resolved identity file has no `description` field
- **THEN** the command lists that source's name and kind with an explicit "no description set" indicator, rather than omitting the source or failing

### Requirement: oprim context list SHALL report identity-only fetch failures per source, without failing the whole command
The system SHALL, when an identity-only fetch fails for one source (unreachable git remote, missing local path), report that source's row as unresolved with the underlying error, while still listing every other configured source successfully.

#### Scenario: One source is unreachable
- **WHEN** a user runs `oprim context list` and one configured `git` source's remote is unreachable while the others are fine
- **THEN** the command lists the unreachable source with an error indicator and still lists all other sources with their descriptions
