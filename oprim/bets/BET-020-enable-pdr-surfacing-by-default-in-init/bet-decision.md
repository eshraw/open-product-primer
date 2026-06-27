# Decision: BET-020 Enable PDR surfacing by default in oprim init
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- Proactive PDR surfacing is one of oprim's most differentiated features but defaults to off
- init prompts "Enable proactive PDR surfacing? (y/N)" using jargon before any PDR exists
- Most installs never enable it; the feature is effectively invisible to the majority of users
- Flipping the default is a one-line change with asymmetric upside

## Alternatives considered
- Keep opt-in — maintains current behavior; preserves user choice but buries the feature
- Improve the description without changing the default — better UX but same adoption problem
- Remove the prompt entirely and always enable — reduces user control; may surprise teams

## Expected outcomes
- PDR surfacing is active in >80% of new installs after the change
- PDR creation rate increases as agents proactively surface decision moments

## Kill criteria / rollback trigger
- Default-on causes confusion or unwanted prompts that make agents measurably less useful (user feedback)

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
