# Design: cross-bet-conflict-graph

## Approach
An on-demand render layer sits directly on top of `findCrossBetConflicts()` (`lib/spec-delta.ts`), the function `oprim validate`'s existing conflict report already calls. `oprim validate --json` already exposes this data; this bet adds a graph rendering of the same data, not a new detection mechanism.

## Key decisions
- **No new detection logic.** Reuses `findCrossBetConflicts()` exactly as `oprim validate` calls it today — this bet is presentation-only.
- **Input: `oprim validate --json` output** (or an in-process call to `findCrossBetConflicts()` directly, avoiding a subprocess round-trip).
- **Format: Mermaid**, consistent with the other graph-mod bets.
- **On-demand only** — a live-updating version depends on BET-052 (live detection) shipping first, which itself depends on the unverified hooks system; explicitly out of scope here.

## Alternatives considered
- Flat text/JSON conflict report — this is `oprim validate`'s current output; the bet adds a graph view on top, not a replacement.
- Waiting for BET-052 before building this — rejected as a hard dependency since the on-demand version ships independently over existing `validate` output.

## Risks
- Per the bet's kill criterion: if conflicts in practice almost always involve just 2 bets, a text warning is already clear enough and this graph is low-value.
