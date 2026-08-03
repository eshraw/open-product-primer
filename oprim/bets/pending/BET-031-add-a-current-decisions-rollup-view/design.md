# Design: Current decisions rollup view (decisions-view-scaffold)

## Approach
Mirror `oprim/scripts/generate-sequence-view.js` exactly, but for `oprim/decisions/` instead of `oprim/sequence.yaml`:

- New script `oprim/scripts/generate-decisions-view.js`, scaffolded by `oprim init` and refreshed by `oprim update`, same as the sequence-view script — no external dependencies, inline parsing.
- The script reads every `PDR-NNN-<slug>.md` file, extracts the `Status` line, and buckets PDRs into "current" (Accepted) vs. "superseded" (`Status: … | Superseded by PDR-YYY`). Superseded PDRs render as a collapsed link under their successor rather than as standalone entries — this is a read-only render, never a delta-merge into decision content itself (deliberately distinct from how `oprim/specs/` current truth is built — see BET-024 contrast in bet-decision.md).
- Output: `oprim/decisions-view.md`, parallel to `oprim/sequence-view.md`.
- Regeneration trigger: `oprim-pdr` runs the script as its last step after writing a PDR file, the same pattern `sequence-view-scaffold` uses for `/oprim:sequence` — chosen over a standalone-only script so the view doesn't silently drift stale.

## Alternatives considered
- Read `oprim/decisions/` directly and rely on the `Status` field with no generated view (status quo) — rejected per bet-decision.md, doesn't solve "what have we currently decided" at a glance
- Apply a spec-style delta-merge "living truth" model to decisions — rejected, conflicts with PDR supersession/immutability (BET-024 contrast)
- Standalone script only, no workflow hook — considered, but a manually-run script is easy to forget; wiring into `oprim-pdr` keeps the view current for free

## Risks
- Regenerating on every `oprim-pdr` invocation adds a step to that skill's flow — low risk since it's the same lightweight `node` invocation the sequence workflow already does
- Parsing PDR markdown inline (no YAML/frontmatter library) means the `Status: … | Superseded by PDR-YYY` line format must stay consistent across PDR files, same constraint the existing PDR-authoring skill already enforces

## Out of scope
- Any change to how PDRs are authored, superseded, or stored (`pdr-authoring`, `product-decision-records` capabilities are untouched)
- A delta-merge or "living truth" model for decisions (explicitly rejected in bet-decision.md)
