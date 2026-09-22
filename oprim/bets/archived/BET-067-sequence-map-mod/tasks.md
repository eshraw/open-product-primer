# Tasks: sequence-map

## 1. Graph rendering
- [x] 1.1 Parse `oprim/sequence.yaml` (`now`/`next`/`later`/`backlog` — the board has no `done` lane; archived bets are removed from `sequence.yaml` entirely — `blocked_by`/`unlocks`) into a node/edge structure (`buildSequenceGraph()` in `packages/cli/src/lib/sequence-graph.ts`)
- [x] 1.2 Render the node/edge structure as Mermaid `graph TD` syntax (`renderMermaid()`, same file)
- [x] 1.3 Label each node with its bet ID and title; distinguish lane status visually via a Mermaid `classDef` per lane (`now`/`next`/`later`/`backlog`, plus `unknown` for a dangling reference)

## 2. Command surface
- [x] 2.1 Add an on-demand command/skill entry point that outputs the rendered graph — both `oprim sequence-map` (CLI, `--json` for `{ nodes, edges, layers, mermaid }`) and `/sequence-map` (the `sequence-map` Claude mod, `.claude/skills/sequence-map/`), which opens a Pane drawing an actual node-and-arrow diagram (an SVG on surfaces that support it — desktop/mobile/vscode; a layered Box grid on the terminal, which has no line-drawing primitive) and an "Export .mmd" button that writes `sequence-map.mmd`. The mod shells out to the CLI rather than re-parsing `sequence.yaml` in its own sandboxed environment, so the two never drift apart; registered in `CLAUDE_MODS_REGISTRY` (`packages/cli/src/lib/claude-mods.ts`) so it installs via `oprim init`/`oprim claude-mods`.
- [x] 2.2 Handle an empty or single-node board (no edges) without erroring

## 3. Validation
- [x] 3.1 Verified output is well-formed Mermaid `graph TD` syntax by inspection and unit test (`packages/cli/src/__tests__/sequence-graph.test.ts`); not round-tripped through a rendering client in this pass
- [x] 3.2 Confirm dangling `blocked_by`/`unlocks` references (already caught by `oprim doctor`'s integrity check) don't break rendering — surfaced as a synthetic node styled `unknown` (dashed red outline) rather than dropped
