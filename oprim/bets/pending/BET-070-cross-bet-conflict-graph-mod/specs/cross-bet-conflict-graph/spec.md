## ADDED Requirements

### Requirement: cross-bet-conflict-graph SHALL render findCrossBetConflicts() output as a graph
The command SHALL call `findCrossBetConflicts()` (or consume `oprim validate --json`'s conflict entries) and render each colliding requirement header as a node connected to the bets whose spec deltas touch it.

#### Scenario: Requirement header colliding across bets
- **GIVEN** `findCrossBetConflicts()` reports a requirement header touched by three active bets' spec deltas
- **WHEN** the conflict-graph command is invoked
- **THEN** it outputs a Mermaid diagram with a node for that requirement header, connected by edges to each of the three bet nodes

### Requirement: cross-bet-conflict-graph SHALL distinguish collisions of 3+ bets from 2-bet collisions
#### Scenario: High-collision requirement is visually distinct
- **GIVEN** a requirement header is touched by 3 or more bets
- **WHEN** the conflict graph is rendered
- **THEN** that node is visually distinguished (e.g. by style or highlight) from requirement headers touched by only 2 bets

### Requirement: cross-bet-conflict-graph SHALL report cleanly when no conflicts exist
#### Scenario: No conflicts found
- **GIVEN** `findCrossBetConflicts()` returns no conflicts
- **WHEN** the conflict-graph command is invoked
- **THEN** it reports that no cross-bet conflicts were found rather than rendering an empty graph
