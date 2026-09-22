# Tasks: remote-context-citation-graph

## 1. Citation data
- [ ] 1.1 Read `remote_context.sources` from `oprim/config.yaml`, resolving each via `lib/remote-context.ts` (identity-only resolution, not full clone, for graph purposes)
- [ ] 1.2 Represent the local project as the graph root, with each registered source as an outgoing citation edge

## 2. Graph rendering
- [ ] 2.1 Render the citation network as a Mermaid `graph LR` diagram (directed: citer → cited)
- [ ] 2.2 Label each source node with its registered `name`

## 3. Command surface
- [ ] 3.1 Add an on-demand command/skill entry point that outputs the rendered graph
- [ ] 3.2 Handle the zero/one-source case by rendering the (sparse) graph rather than erroring
- [ ] 3.3 Surface unresolvable sources (per `oprim doctor`'s existing remote-context validation) distinctly on the graph rather than silently omitting them
