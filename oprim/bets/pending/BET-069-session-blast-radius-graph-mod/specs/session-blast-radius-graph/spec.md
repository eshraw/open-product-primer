## ADDED Requirements

### Requirement: session-blast-radius-graph SHALL render a session's changed files and their cross-references as a graph
The command SHALL run `git diff` against a base ref to determine the session's changed files, resolve cross-references limited to `BET-NNN`, `PDR-NNN`, and `### Requirement:` header patterns, and render the result as a Mermaid `graph TD` diagram.

#### Scenario: Session with cross-referenced changes
- **GIVEN** the session changed a spec delta file that references `BET-042` and a `### Requirement:` header present in another file
- **WHEN** the blast-radius command is invoked
- **THEN** it outputs a graph with a node for the changed file, nodes for `BET-042` and the referenced requirement, and edges connecting them

### Requirement: session-blast-radius-graph SHALL limit cross-reference resolution to known link types
The command SHALL only resolve `BET-NNN`, `PDR-NNN`, and `### Requirement:` header references, and SHALL NOT infer links from unscoped free-text matching.

#### Scenario: Unrelated text mention is not treated as a link
- **GIVEN** a changed file contains prose text that is not a `BET-NNN`, `PDR-NNN`, or `### Requirement:` header pattern
- **WHEN** the blast-radius command resolves cross-references
- **THEN** that text is not rendered as a graph edge

### Requirement: session-blast-radius-graph SHALL render isolated changes without error
#### Scenario: No cross-references found
- **GIVEN** the session's changed files contain no `BET-NNN`, `PDR-NNN`, or requirement-header references
- **WHEN** the blast-radius command is invoked
- **THEN** it renders the changed files as disconnected nodes rather than erroring
