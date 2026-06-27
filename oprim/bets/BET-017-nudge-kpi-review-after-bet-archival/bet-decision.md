# Decision: BET-017 Nudge KPI review creation after bet archival to close the outcome loop
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- The outcome loop (bet → implement → archive → review) is the product's core value proposition
- Currently archival only prompts OpenSpec co-archival — KPI review creation is never suggested
- Bets are being archived without recording outcomes; the learning loop is broken by default
- The on-stop.sh hook already demonstrates the pattern; extending it is low-effort

## Alternatives considered
- Rely on team discipline to trigger oprim-review manually — current state; not working
- Cron-based reminder after N days — adds complexity; disconnected from the archive event
- Make review mandatory before archive — too heavy; blocks archival when data isn't ready

## Expected outcomes
- KPI review creation rate increases following bet archival
- Outcomes are captured for >50% of archived bets within 30 days of archival

## Kill criteria / rollback trigger
- Nudge is consistently dismissed with no review created — indicates timing or friction issue, not a missing feature

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
