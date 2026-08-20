## Requirements

### Requirement: The oprim CLI SHALL provide a `list` command that enumerates oprim artifacts by type
`oprim list` gives scriptable access to bets, decisions, and notes without parsing their underlying YAML/markdown files directly.

#### Scenario: List bets in human-readable form
- **GIVEN** bets exist under `oprim/bets/pending/` and `oprim/bets/archived/`
- **WHEN** the user runs `oprim list --bets`
- **THEN** oprim prints a human-readable table of bet id, title, and status for each bet

#### Scenario: List filtered by artifact type
- **GIVEN** PDRs exist under `oprim/decisions/` and notes exist under `oprim/notes/`
- **WHEN** the user runs `oprim list --decisions` or `oprim list --notes`
- **THEN** oprim lists only the requested artifact type
- **AND** combining flags (e.g. `--bets --decisions`) lists both types

#### Scenario: Default to bets when no type flag is given
- **WHEN** the user runs `oprim list` with no type flag
- **THEN** oprim lists bets, the same as `oprim list --bets`

#### Scenario: List as JSON
- **WHEN** the user runs `oprim list --bets --json`
- **THEN** oprim prints a JSON object with a `bets` array of `{ id, title, status, path }` entries to stdout
- **AND** no human-readable text is mixed into the output

### Requirement: The oprim CLI SHALL provide a `show` command that displays a single artifact resolved by ID
`oprim show <ID>` dispatches by ID prefix (`BET-`, `PDR-`, `NOTE-`) so a single command can resolve any addressable oprim artifact.

#### Scenario: Show a bet by ID
- **WHEN** the user runs `oprim show BET-030`
- **THEN** oprim resolves the bet directory and prints its decision status, links, and file path in human-readable form

#### Scenario: Show a decision or note by ID
- **WHEN** the user runs `oprim show PDR-005` or `oprim show NOTE-012`
- **THEN** oprim resolves the matching file by prefix and prints that artifact's content and metadata

#### Scenario: Show as JSON
- **WHEN** the user runs `oprim show BET-030 --json`
- **THEN** oprim prints a JSON object with `type`, `id`, `path`, artifact-specific fields, and `content` (the raw markdown)

#### Scenario: Unresolvable ID
- **GIVEN** no artifact matches the given ID
- **WHEN** the user runs `oprim show BET-999`
- **THEN** oprim reports that the ID was not found and exits with a non-zero status code

### Requirement: The oprim CLI SHALL provide a `status` command that reports sequencing board state
`oprim status` exposes `oprim/sequence.yaml`'s board state as a scriptable read-only view, without regenerating `sequence-view.md`.

#### Scenario: Human-readable board status
- **WHEN** the user runs `oprim status`
- **THEN** oprim prints the now/next/later/backlog lanes and current WIP limit usage

#### Scenario: JSON board status
- **WHEN** the user runs `oprim status --json`
- **THEN** oprim prints a JSON object containing `wip_limits`, `now`, `next`, `later`, and `backlog`, matching `sequence.yaml`'s structure
