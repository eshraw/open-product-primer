## ADDED Requirements

### Requirement: remote-context-citation-graph SHALL render registered remote-context sources as a citation graph
The command SHALL resolve `remote_context.sources` from `oprim/config.yaml` via `lib/remote-context.ts` and render the local project plus its registered sources as a directed Mermaid `graph LR` diagram (citer → cited).

#### Scenario: Project with registered sources
- **GIVEN** `oprim/config.yaml` has two entries under `remote_context.sources`
- **WHEN** the citation-graph command is invoked
- **THEN** it outputs a graph with the local project as root and one edge per registered source, labeled with each source's `name`

### Requirement: remote-context-citation-graph SHALL surface unresolvable sources distinctly
#### Scenario: A registered source fails to resolve
- **GIVEN** a registered `remote_context` source fails resolution (the same failure `oprim doctor` already detects)
- **WHEN** the citation-graph command is invoked
- **THEN** that source's node is visually marked as unresolved rather than omitted from the graph

### Requirement: remote-context-citation-graph SHALL render a sparse network without error
#### Scenario: No sources registered
- **GIVEN** `remote_context.sources` is empty
- **WHEN** the citation-graph command is invoked
- **THEN** it renders the local project as a single root node rather than erroring
