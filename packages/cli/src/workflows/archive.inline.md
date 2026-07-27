### Bet archiving (oprim-archive)
Archive a completed bet.

1. Ask for bet ID (accept bet-005, 005, 5, BET-005 — normalize to BET-NNN).
2. Verify `oprim/bets/BET-NNN/` exists.
3. Check `oprim/sequence.yaml` for entries where `blocked_by` or `unlocks` reference the target bet — warn if found. Also check other active bet dirs for delta specs against the same requirement (matching `### Requirement:` headers, whitespace-insensitive) — warn if an overlap is found. Ask "Archive anyway? (y/N)" if either warning fires.
4. If `oprim/bets/BET-NNN/specs/` exists, fold each capability's `## ADDED`/`## MODIFIED`/`## REMOVED Requirements` delta into `oprim/specs/<capability>/spec.md` (matching by `### Requirement:` header; create the current-truth file if the delta is entirely ADDED) — last-write-wins on overlaps, no 3-way merge. Skip this step entirely if no `specs/` dir is present.
5. Move directory: `oprim/bets/BET-NNN → oprim/bets/archived/BET-NNN`.
6. Remove the bet entry from `oprim/sequence.yaml`.
7. Report what was done.