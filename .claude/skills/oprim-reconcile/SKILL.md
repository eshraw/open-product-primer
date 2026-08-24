---
name: oprim-reconcile
description: Detect and fix drift across linked oprim artifacts (PDR, bet, criteria, review)
---

Detect drift across linked oprim artifacts — PDR ↔ bet, bet ↔ criteria, bet ↔ review — and fix it with the user's per-item confirmation. Reconcile never batch-applies a fix; every proposed change is surfaced individually before it's written.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## What you're doing

oprim artifacts reference each other (a bet's `## Links` section names PDRs, notes, and specs; a review's filename names the bet it reviews) but nothing currently checks those references stay valid as artifacts are renamed, moved, or archived. Reconcile is a read-then-confirm-then-write pass over that link graph — it detects drift, proposes a specific fix per item, and only writes a fix the user confirms. This is distinct from `oprim doctor`, which reports sequencing-board and skill-drift issues but never writes a fix itself.

## Steps

### 1. Scan bet-decision `## Links` sections
For every `bet-decision.md` under `oprim/bets/pending/` and `oprim/bets/archived/`, read its `## Links` section and check each reference:
- `PDRs: PDR-NNN, ...` — for each ID (skip "None"), verify a matching `oprim/decisions/PDR-NNN-*.md` exists
- `Notes: NOTE-NNN, ...` — for each ID, verify a matching `oprim/notes/NOTE-NNN-*.md` exists
- `Spec (delta): <path>` — verify the path exists
- `OpenSpec change: <path>` — skip if the value is still a placeholder (e.g. "to be filled when promoted" or "None"); otherwise verify the path exists

Record a drift entry for every reference that fails to resolve: which bet, which link line, which ID/path is missing.

### 2. Scan review filenames against bets
For every `oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md` file, extract `BET-NNN` and verify a matching bet directory exists in either `oprim/bets/pending/` or `oprim/bets/archived/`. Record a drift entry for any review whose bet can't be found.

### 3. Scan criteria.yaml placement
For every `oprim/bets/pending/BET-NNN.../criteria.yaml`, this is only valid while the bet is pending — it's expected to travel with the bet directory on archive, so no separate reference check is needed here. Skip this step; it exists to document why criteria.yaml isn't independently checked.

### 4. Report detected drift
If no drift was found in steps 1–2, report "No drift detected across PDR/bet/criteria/review links" and stop.

Otherwise, list every drift entry found:

**Detected drift:**
- BET-NNN `## Links`: `PDRs` references PDR-XXX, which does not exist at `oprim/decisions/PDR-XXX-*.md`
- `oprim/reviews/<file>` references BET-NNN, which does not exist in `oprim/bets/pending/` or `oprim/bets/archived/`

### 5. Propose and confirm a fix, one item at a time
For each drift entry, propose a specific fix:
- A dangling PDR/Notes ID in a `## Links` line → propose removing that ID from the comma-separated list (or replacing the line with "None" if it was the only entry)
- A `Spec (delta)` or `OpenSpec change` path that no longer resolves → propose removing that link line entirely
- A review referencing a bet that no longer exists → propose no automatic fix (the bet may have been renamed rather than deleted); ask the user to identify the correct BET-NNN or confirm the review is orphaned and should be left as-is

Ask: "Apply this fix? (y/N)" for each entry individually.
- If confirmed: apply only that fix to the relevant file, then move to the next drift entry.
- If declined: leave the artifact unchanged and move to the next drift entry.

### 6. Report what was fixed
Summarize: how many drift entries were found, how many fixes were applied, how many were declined or left for manual follow-up.
