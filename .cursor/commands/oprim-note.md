---
name: /oprim-note
id: oprim-note
category: Workflow
description: Create a new atomic note for lightweight thinking capture
---

Create a new note in `oprim/notes/` for lightweight thinking capture — an observation, idea, or connection that hasn't yet earned a place in a bet or PDR. Notes carry no owner or kill criterion; promote one into a bet later with `/oprim:promote NOTE-NNN`. Ask for a short title. Scan `oprim/notes/NOTE-(\d+)-` for the next id (zero-padded, default 001). Ask for the note body (free-form), tags, and optional related BET-IDs. Tags are checked against `oprim/config.yaml`'s `notes.tags`; any new tag is accepted and appended to that list rather than rejected — the vocabulary grows from usage. Read `oprim/templates/note.md` — if its frontmatter has a `description:` field, this workspace is on the OKF tier and needs a one-line description; if it has no `description:` field, use the minimal tier; if the file doesn't exist, fall back to reading `okf.enabled` directly from `oprim/config.yaml`. Write `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier and a `## Bets` section listing any related BET-IDs. For each related bet, append `- Notes: NOTE-NNN` to that bet-decision's `## Links` section. Report what was created.