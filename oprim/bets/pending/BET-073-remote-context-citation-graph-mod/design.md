# Design: remote-context-citation-graph

## Approach
An on-demand render layer sits on top of `lib/remote-context.ts`'s existing resolution — the same data `oprim context list` already produces per-source. This bet renders the full citation network (which projects register which other projects as remote context sources) as a graph, instead of requiring one-source-at-a-time inspection.

## Key decisions
- **No new resolution logic.** Reuses `remote_context.sources` resolution from `oprim/config.yaml` and `lib/remote-context.ts` exactly as `oprim context`/`oprim context list` call it today.
- **Format: Mermaid**, consistent with the other graph-mod bets.
- **Read-only, on-demand** — no dependency on the unverified hooks system.
- **Local project as the graph's root node**, with registered `remote_context.sources` entries as edges out (citing) — citation direction (who registers whom) matters more than a purely undirected network, since `remote_context` is inherently directional (consumer registers source).

## Alternatives considered
- Status quo: `oprim context list` per-project text output, inspected one source at a time — this bet adds a graph view on top, not a replacement.

## Risks
- Per the bet's kill criterion: if most projects register 0-1 sources, the network is too sparse to visualize meaningfully until remote-context adoption grows.
