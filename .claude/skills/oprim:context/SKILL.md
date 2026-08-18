---
name: oprim:context
description: Surface relevant product decisions from oprim/decisions/ by keyword-matching against the current conversation — invoke at the start of any oprim or openspec workflow when PDR surfacing is enabled
---

Scan `oprim/decisions/` and surface PDRs that match keywords from the current conversation.

## Steps

### 1. Check for decisions
Scan `oprim/decisions/` for files matching `PDR-*.md`. If the directory is empty or contains no PDR files, exit silently — produce no output and return immediately.

### 2. Extract keywords
From the current conversation context, extract 3–10 topic keywords: bet IDs referenced (e.g. `BET-007`), capability names, filenames mentioned, subject-area nouns. Focus on the most specific and distinctive terms.

### 3. Match PDRs
For each PDR file: read the filename and the first 25 lines (to capture title, status, and context). A PDR is relevant if any keyword appears in the filename, title (`# PDR-NNN: ...`), or body text (case-insensitive).

### 4. Report or exit silently
If one or more PDRs match:

**Relevant product decisions:**
- PDR-NNN: <title> — <Status> (`oprim/decisions/PDR-NNN-<slug>.md`)

List each match on its own line, then return — the invoking skill continues to its next step.

If no PDRs match: exit silently — produce no output.
