# Design: Invert id/title field order in sequence.yaml

## Approach
`sequence.yaml` is generated and rewritten by `oprim-bet`, `oprim-sequence`, and `oprim:promote`'s bet registration step. Each currently emits `id:` then `title:` per block. Flip the emission order to `title:` then `id:` in the template/writer logic these three paths share, and reorder existing blocks the next time each is touched (no bulk rewrite of untouched entries, to keep diffs minimal and scoped to blocks already in flight).

Field order in YAML has no semantic meaning to parsers — this is purely a rendering/authoring convention change. `oprim doctor`/`oprim validate`'s sequencing-integrity checks read by key, not position, so no reader-side change is required.

## Alternatives considered
- **Rewrite the whole file at once**: touches every bet block in one commit, obscuring the actual functional diff in future PRs that also modify sequence.yaml. Rejected in favor of reordering opportunistically as blocks are touched.
- **Enforce order via a schema/linter**: adds a new validation dependency for a purely cosmetic convention. Not worth the overhead; `oprim doctor` can optionally warn instead if drift becomes a real problem later.

## Risks
- Low risk: pure formatting change, no data model impact. Main risk is inconsistent order across old vs. newly-touched entries until the whole file is naturally reordered over time — acceptable since it's a display convenience, not a correctness requirement.
