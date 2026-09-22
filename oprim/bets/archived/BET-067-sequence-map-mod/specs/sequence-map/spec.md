## ADDED Requirements

### Requirement: sequence-map SHALL render the sequencing board's dependency edges as a graph
The command SHALL parse `oprim/sequence.yaml`'s `blocked_by`/`unlocks` fields across `now`/`backlog`/`done` entries and render them as a Mermaid `graph TD` diagram, on demand.

#### Scenario: Rendering a populated board
- **GIVEN** `oprim/sequence.yaml` has bets in `now`, `backlog`, and `done` with `blocked_by`/`unlocks` edges between them
- **WHEN** the dependency-graph command is invoked
- **THEN** it outputs a Mermaid `graph TD` diagram with one node per bet, labeled by bet ID and title, and one edge per `blocked_by`/`unlocks` relationship

### Requirement: sequence-map SHALL distinguish board status per node
Each rendered node SHALL visually indicate whether its bet is in `now`, `backlog`, or `done`.

#### Scenario: Status is visible at a glance
- **WHEN** the graph is rendered
- **THEN** nodes for `now`, `backlog`, and `done` bets are visually distinguishable (e.g. by shape, prefix, or style) without opening `sequence.yaml`

### Requirement: sequence-map SHALL handle an empty or edge-free board without error
#### Scenario: Board with no dependency edges
- **GIVEN** `oprim/sequence.yaml` has bets but no `blocked_by`/`unlocks` edges between them
- **WHEN** the dependency-graph command is invoked
- **THEN** it renders a graph of disconnected nodes rather than erroring or producing empty output
