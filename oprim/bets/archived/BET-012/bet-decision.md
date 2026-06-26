# Decision: BET-012 Add title slugs to bet directories for scannability
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-26
- Owner: Eshane Rawat
- Review date: 2026-07-26

## Why now
- BET-NNN dirs give no context without opening the file
- PDRs and OpenSpec changes already use slug naming — bets should match
- As the backlog grows, opaque IDs slow down reviews and sequencing

## Alternatives considered
- Add a README index file — keeps BET-NNN dirs but adds indirection; doesn't fix filesystem navigation
- Do nothing — accept opaque dirs and rely on opening files

## Expected outcomes
- Bet dirs are self-explanatory on the filesystem (e.g. BET-012-add-title-slugs-to-bet-dirs — no need to open the file)
- Consistent naming across all oprim artifacts (bets, PDRs, and OpenSpec changes all use NNN-slug)
- Faster sequencing reviews — reviewers can scan the board without opening individual files

## Kill criteria / rollback trigger
- Archive/reference tooling breaks on the new format (other skills or hooks fail to resolve BET-NNN-slug dirs)
- Slugs become stale or misleading (titles change but dirs aren't renamed, adding confusion)

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-012-add-title-slugs-to-bet-dirs
