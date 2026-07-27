### Note authoring (oprim-note)
Create a new note in `oprim/notes/` for lightweight thinking capture — not a bet, no owner or kill criterion.

1. Ask for a short title.
2. Assign next NOTE ID: scan `oprim/notes/NOTE-(\d+)-`, max+1 zero-padded to 3 digits (default 001).
3. Ask for the note body (free-form), tags, and optional related BET-IDs.
4. Tags: check against `oprim/config.yaml`'s `notes.tags` — accept and append any new tag rather than rejecting it (the vocabulary grows from usage).
5. Check `oprim/templates/note.md`: a `description:` field in its frontmatter means the OKF tier (gather a one-line description); no field means the minimal tier; if the file is missing, fall back to `okf.enabled` in `oprim/config.yaml`.
6. Write `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier and a `## Bets` section.
7. For each related bet, append `- Notes: NOTE-NNN` to that bet's `## Links` section.
8. Report what was created.