### PDR authoring (oprim-pdr)
Create a new Product Decision Record in `oprim/decisions/`.

1. Ask for decision title.
2. Assign next PDR ID: scan `oprim/decisions/PDR-(\d+)-`, max+1 zero-padded to 3 digits (default 001).
2b. Read `oprim/config.yaml`'s `rules.pdr` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
3. Gather: context, decision, alternatives, consequences, evidence, related bets/specs.
4. Ask if superseding an existing PDR.
5. Write `oprim/decisions/PDR-NNN-<slug>.md`. If superseding, update old PDR Status.
6. Report what was created.
7. Run `node oprim/scripts/generate-decisions-view.js` from the project root to update `oprim/decisions-view.md`.