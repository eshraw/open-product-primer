## ADDED Requirements

### Requirement: A visual view SHALL be generated from sequence.yaml
The system SHALL produce a Mermaid diagram committed as `oprim/sequence-view.md`, derived from the current state of `oprim/sequence.yaml`. The view SHALL be regenerated whenever the sequencing board is updated via `/oprim:sequence`.

#### Scenario: View generated after sequence update
- **WHEN** a user runs `/oprim:sequence` and the board state changes
- **THEN** `oprim/sequence-view.md` is written with an up-to-date Mermaid diagram reflecting the current board state

#### Scenario: View file committed alongside sequence.yaml
- **WHEN** a user stages changes after running `/oprim:sequence`
- **THEN** both `oprim/sequence.yaml` and `oprim/sequence-view.md` are present in the diff

### Requirement: The view SHALL group bets by bucket
The Mermaid diagram SHALL display bets in labelled subgraph sections corresponding to the `now`, `next`, and `later` buckets. The `backlog` bucket SHALL be rendered as a plain list below the diagram rather than as a subgraph, to limit diagram complexity.

#### Scenario: Active buckets rendered as subgraphs
- **WHEN** the view is generated from a board with bets in now, next, and later
- **THEN** the diagram contains three subgraph sections labelled "Now", "Next", and "Later" with the correct bets in each

#### Scenario: Backlog rendered as list
- **WHEN** the board has entries in the backlog bucket
- **THEN** the backlog entries are rendered as a Markdown list below the Mermaid block, not inside the diagram

### Requirement: The view SHALL render dependency relationships
The diagram SHALL include directed edges from each bet to any bets it is `blocked_by`. Bets with no `blocked_by` entries SHALL appear as standalone nodes.

#### Scenario: Blocked bet shows dependency arrow
- **WHEN** a bet has a non-empty `blocked_by` list
- **THEN** the diagram contains a directed arrow from that bet to each blocker

#### Scenario: Unblocked bet has no incoming arrows
- **WHEN** a bet has an empty `blocked_by` list
- **THEN** the diagram renders that bet as a standalone node with no incoming dependency edges

### Requirement: The view SHALL be renderable in GitHub without tooling
The output file SHALL be a standard Markdown file containing a fenced Mermaid code block, so that GitHub renders it inline without any additional build step or local tooling.

#### Scenario: Rendered in GitHub
- **WHEN** a user opens `oprim/sequence-view.md` in the GitHub web UI
- **THEN** the diagram is displayed as a rendered graph, not as raw Mermaid syntax
