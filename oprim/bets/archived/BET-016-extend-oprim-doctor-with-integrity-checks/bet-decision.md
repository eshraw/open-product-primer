# Decision: BET-016 Extend oprim doctor with integrity checks for sequence and skills
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- doctor only checks file/dir existence; WIP limits, blocked_by, and unlocks references are never validated
- The live workspace already has now/next empty with bets in backlog — doctor passes silently with no nudge
- Integrity gaps compound over time; harder to fix post-1.0.0 once users accumulate invalid state
- Skill version drift (installed skills out of sync with CLI) is undetected today

## Alternatives considered
- Rely on agent skills for validation — adds an LLM call just to catch a broken reference
- Manual sequence review — doesn't scale; error-prone
- Extend `oprim status` to include health signals — conflates two concerns; doctor is the right home

## Expected outcomes
- doctor catches WIP violations, dangling blocked_by/unlocks references, and skill version drift
- Developers fix sequence issues before they cascade

## Kill criteria / rollback trigger
- Integrity checks produce too many false positives or run too slowly to be useful in CI

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-016-extend-doctor-integrity-checks/
