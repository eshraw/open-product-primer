# Design: explore-reconcile-commands

## Approach

Both commands follow oprim's existing pattern: a `<id>.schema.yaml` + `<id>.template.md` pair under `packages/cli/src/workflows/`, rendered per-agent by `workflow-renderer.ts`, installed as a Claude skill + thin command wrapper (and the Cursor/Codex/Gemini/Poolside/Vibe/Kimi equivalents) via `install-agent.ts`. Neither command needs new backend logic in the CLI itself — they are content-driven skills, consistent with the rest of oprim's "primer is prose, not code" design.

### `explore`
- A guided, read-only investigation skill. It surfaces relevant PDRs (reusing the `oprim:context` skill's keyword-matching approach) and notes, then walks the user through comparing candidate framings.
- Deliberately does not write `bet-decision.md`. Keeping it non-committal avoids overlapping with `oprim-bet`'s job and keeps the "explore vs. bet" boundary legible.
- Ends by pointing to `/oprim:bet` once the user has converged on a candidate, rather than absorbing bet-drafting itself.

### `reconcile`
- A drift-detection + guided-fix skill over the PDR ↔ bet ↔ criteria ↔ review link graph.
- Detection logic: read `Links` sections in bet-decision.md, criteria.yaml source bet references, and review.md criteria references; check each referenced path/ID still exists and, where feasible, that referenced titles/IDs still match.
- Fix application requires per-item confirmation (see open question below) — reconcile proposes, the user confirms, reconcile writes. No batch auto-apply.
- Scoped to detecting/fixing broken or stale *links*, not re-authoring artifact content — that keeps it distinct from `oprim doctor` (integrity/WIP checks) and from re-running `oprim-bet`/`oprim-criteria`/`oprim-review` by hand.

## Alternatives considered
- **Fold reconcile into `oprim doctor`**: rejected — doctor is intentionally read-only reporting with no exit code implications for `validate`; reconcile needs to *write* fixes, which is a different contract.
- **Auto-apply all reconcile fixes**: rejected per user decision — per-item confirmation keeps the user in control, consistent with how `oprim-archive` and other write-capable skills prompt before mutating artifacts.
- **Let explore create the bet directly**: rejected per user decision — keeping explore non-committal avoids duplicating `oprim-bet`'s responsibility and keeps a clean read-only/write-capable boundary between the two commands.

## Risks
- Scope overlap confusion between `explore` and the existing bet/discovery skills (flagged in the bet's own kill criteria) — mitigated by explore's strict non-write boundary.
- Reconcile's link-staleness heuristics may produce false positives on legitimately renamed/moved artifacts — mitigated by requiring confirmation before any fix is applied.
