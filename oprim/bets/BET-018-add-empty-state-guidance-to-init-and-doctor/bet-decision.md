# Decision: BET-018 Add empty-state guidance to init and doctor for new user onboarding
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- oprim init ends with "Run oprim doctor" and doctor ends with a pass count — neither tells a new user what to do next
- The decisions/ directory is still .gitkeep in oprim's own repo — signals PDR adoption is stalled
- Cold-start friction is the leading reason new developer tools don't stick
- The fix is low-effort: a context-sensitive footer on two existing commands

## Alternatives considered
- Rely on README docs — most developers don't read docs before running a CLI tool
- Let the agent suggest next steps — requires starting an LLM session; too much friction for cold start
- Onboarding wizard in init — too heavyweight; the tool is deliberately lightweight

## Expected outcomes
- New users create their first bet in the same session as oprim init
- Time-to-first-bet decreases from unknown to measurable

## Kill criteria / rollback trigger
- Guidance footer is ignored consistently — suggests discoverability problem is upstream of the CLI

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
