# Decision: BET-008 Improve bet naming for scannability

## Status
- Decision: Build now
- Date: 2026-05-28
- Owner: Eshane Rawat
- Review date: 2026-06-28

## Why now
- Bet list is growing and getting harder to scan as more bets are added
- Naming discipline is cheapest at creation time; retroactively renaming is harder
- Impacts every collaborator who uses the sequencing board

## Alternatives considered
- Add descriptions to sequence.yaml entries — augments structure without renaming, but doesn't fix the root naming problem
- Use a separate index or README per bet — offloads context to a richer format but adds indirection
- Do nothing — accept opaque names and rely on opening files to understand purpose

## Expected outcomes
- Any bet title is self-explanatory on first read, no need to open the file
- New bets are created with clear names from the start via oprim-bet skill convention

## Kill criteria / rollback trigger
- Names stay opaque after applying the convention — if the format doesn't actually improve clarity, abandon it
- Convention adds more friction than value at creation time — if writing names to spec significantly slows bet creation

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
