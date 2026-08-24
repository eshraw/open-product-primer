---
name: oprim-note
description: Create a new atomic note in oprim/notes/ for lightweight thinking capture, with tiered frontmatter and optional bet links
---

Create a new note in `oprim/notes/` for lightweight thinking capture — an observation, idea, or connection that hasn't yet earned a place in a bet or PDR.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## What you're creating

A note is a small, disposable unit of thinking: an observation, a stray idea, or a connection between bets, captured before it's proven enough to belong in a discovery hypothesis or bet-decision. Notes carry no owner and no kill criterion — they're not commitments. Promote a note into a bet later with `/oprim:promote NOTE-NNN` once it's worth committing to.

## Steps

### 1. Get the note title
If not provided, ask: "What is this note about? (a short title)"

### 2. Assign the next NOTE ID
Scan `oprim/notes/` for files matching `NOTE-(\d+)-`. Extract the numeric part from each match. Assign max+1, zero-padded to 3 digits. Default `001` if none found.

### 2b. Derive the slug
From the note title: lowercase all characters, replace any character that is not a letter or digit with a hyphen, collapse consecutive hyphens to one, strip leading/trailing hyphens, truncate to 40 characters at the last hyphen boundary. This becomes `<slug>`.
Output path: `oprim/notes/NOTE-NNN-<slug>.md`

### 3. Gather the note body
Ask: "What's the observation, idea, or connection?" (free-form prose — this becomes the note body).

### 4. Gather tags
Read `oprim/config.yaml`. If it has a `notes:` section with a `tags:` list, show it and ask the user to pick from it or add new ones. If `notes.tags` is absent or empty, ask for tags directly (comma-separated) — there's no vocabulary yet to constrain against.
A tag not already in `notes.tags` SHALL be accepted, never rejected, and appended to `oprim/config.yaml`'s `notes.tags` list (creating the `notes:` section if absent) — the vocabulary grows from usage rather than requiring upfront authoring.

### 5. Gather optional bet links
Ask: "Does this relate to any existing bets? (comma-separated BET-IDs, or Enter to skip)"

### 6. Check the frontmatter tier
Read `oprim/templates/note.md`.
- If it exists and its frontmatter block contains a `description:` field, this workspace is on the **OKF tier** — ask for a one-line description.
- If it exists with no `description:` field, use the **minimal tier** — skip the description.
- If the file doesn't exist (project initialized before notes were introduced), read `oprim/config.yaml` directly: `okf.enabled: true` → OKF tier (ask for a description); otherwise → minimal tier.

### 7. Write oprim/notes/NOTE-NNN-<slug>.md

Minimal tier:
```
---
type: note
title: "<title>"
tags: [<tags>]
timestamp: <today, ISO 8601>
---

# Note: <title>

<body>

## Bets
- <BET-IDs from step 5, or "None">
```

OKF tier: same as above, with `description: "<description>"` inserted immediately after `title`.

### 8. Link back from referenced bets
For each BET-ID gathered in step 5: read `oprim/bets/pending/BET-NNN/bet-decision.md`, and add `- Notes: NOTE-NNN` under its `## Links` section (append to an existing `Notes:` line, or add a new one).

### 9. Report what was created
