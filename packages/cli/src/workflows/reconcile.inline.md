### Artifact reconciliation (oprim-reconcile)
Detect and fix drift across linked oprim artifacts (PDR ↔ bet, bet ↔ review). Never batch-applies a fix — every proposed change is confirmed individually before being written.

1. Scan every `bet-decision.md` under `oprim/bets/pending/` and `oprim/bets/archived/`: check each `## Links` reference (PDRs, Notes, Spec (delta), OpenSpec change) actually resolves to an existing file/path.
2. Scan every `oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md` filename: check the referenced BET-NNN still exists in pending or archived bets.
3. If nothing is found, report "No drift detected" and stop.
4. Otherwise, list every drift entry, propose a specific fix per entry (e.g. remove a dangling ID from a `## Links` line), and ask "Apply this fix? (y/N)" one item at a time — apply only confirmed fixes.
5. Report how many drift entries were found, fixed, and left unresolved.
