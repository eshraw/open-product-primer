# Decision: BET-009 Add a way to archive bets to avoid clutter

## Status
- Decision: Build now
- Date: 2026-05-28
- Owner: Eshane Rawat
- Review date: 2026-06-28

## Why now
- The bet list will grow unboundedly as bets complete — without archival, every bet ever created stays in the list forever
- Completed bets create noise when planning next work, mixing done/in-progress/future bets on the same board
- The archive pattern already exists in openspec — this extends a proven pattern rather than inventing a new one

## Alternatives considered
- Add a `status: archived` field to sequence.yaml — keeps bets in-file but hides them via a flag; doesn't reduce file size or list length
- Create a separate `archived-bets` section in sequence.yaml — partitions the YAML but still inflates the same file over time
- Do nothing — rely on manual cleanup; doesn't scale and creates inconsistency across teams

## Expected outcomes
- sequence.yaml only shows active/future bets; archived bets are moved out so the board stays scannable
- Full audit trail is preserved in an archive folder — bets are never deleted, just moved out of the active list
- Archival is an explicit manual step, not an automatic trigger

## Kill criteria / rollback trigger
- Archival adds friction without visible board improvement — if moving bets out doesn't make the active list noticeably cleaner, reconsider
- Audit trail is harder to access than before — if archived bets become hard to find or reference, it's worse than the original problem

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-009-archive-bets-to-reduce-clutter
