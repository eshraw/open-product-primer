# Decision: BET-021 Add public README quickstart and CHANGELOG for 1.0.0 external readiness
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- CHANGELOG.md is empty; README has no quickstart for users outside the project
- 1.0.0 is a public stability signal — external readiness is a prerequisite for the version bump
- No way for someone outside the project to understand what oprim is or how to start
- Without docs, any organic interest from npm/GitHub converts to zero installs

## Alternatives considered
- Defer docs to post-1.0.0 — ships a 1.0.0 that external users can't onboard to
- Rely on GitHub repo description only — insufficient; no install path or usage examples
- Auto-generate from code comments — too thin; oprim's value prop needs a narrative, not a reference

## Expected outcomes
- An external developer can install and run oprim init from the README alone, without prior knowledge
- CHANGELOG covers all 0.x versions so 1.0.0 release notes have context

## Kill criteria / rollback trigger
- Docs are published but no external installs occur — indicates distribution or positioning issue, not a docs gap

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-021-add-public-readme-and-changelog
