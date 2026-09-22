# Design: bet-lineage-dependency-graph

## Approach
An on-demand command/skill walks a single bet's link fields — `bet-decision.md`'s `## Links` (`PDRs:`, `OpenSpec change:`), `criteria.yaml` (if present), and `specs/<capability>/spec.md` deltas — and renders the PDR → bet → criteria → spec-delta → archive chain as a graph, in place of manual file-to-file link following.

Scoped per bet (input: a bet ID), not a whole-project lineage dump — CLAUDE.md's authority-boundary chain is inherently per-bet, and a single-bet graph stays readable even as the project accumulates bets.

## Key decisions
- **Scope: one bet at a time**, addressed by ID, mirroring how `oprim-archive`/`oprim-spec` already resolve a bet directory.
- **Format: Mermaid**, consistent with [[sequence-map]] (BET-067) for a uniform rendering convention across the graph-mod family.
- **Read-only over existing link fields** — no new metadata written to bets, PDRs, or criteria files.

## Alternatives considered
- A text-only lineage report — rejected as the bet's own comparison: simpler, but loses the at-a-glance shape for bets with multiple PDR links or spec deltas.

## Risks
- Sparse lineage (bets with no PDR, no criteria) may make the graph trivial; the bet's kill criterion covers this — rescope to a text report if most bets are this sparse.
