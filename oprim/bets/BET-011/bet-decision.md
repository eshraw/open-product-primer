# Decision: BET-011 Remove checks on archived bets in oprim doctor
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-03
- Owner: Eshane
- Review date: 2026-07-03

## Why now
- Archived bets are done — their criteria/measurements no longer need monitoring
- Doctor should only surface actionable items; scanning archived bets produces noise that erodes trust in its output

## Alternatives considered
- Add an `--include-archived` flag to opt in — skip archived bets by default, allow explicit override for users who want to audit them

## Expected outcomes
- Doctor run time reduced by skipping archived bet scans as the archived set grows (baseline: all bets scanned → target: only active bets scanned)

## Kill criteria / rollback trigger
- Users need to audit archived bets via doctor — restore the checks
- The change causes doctor to miss legitimate issues in active bets — revert

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
