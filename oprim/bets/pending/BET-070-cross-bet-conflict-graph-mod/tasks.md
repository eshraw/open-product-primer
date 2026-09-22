# Tasks: cross-bet-conflict-graph

## 1. Conflict data
- [ ] 1.1 Call `findCrossBetConflicts()` (`lib/spec-delta.ts`) directly, or parse `oprim validate --json`'s conflict entries
- [ ] 1.2 Group conflicts by overlapping requirement header across bets

## 2. Graph rendering
- [ ] 2.1 Render each colliding requirement header as a node, with edges to each bet whose delta touches it
- [ ] 2.2 Highlight requirement headers with 3+ colliding bets distinctly from 2-bet collisions

## 3. Command surface
- [ ] 3.1 Add an on-demand command/skill entry point that outputs the rendered graph
- [ ] 3.2 Handle a no-conflicts case by reporting "no cross-bet conflicts found" rather than an empty graph
