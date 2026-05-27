# Decision: BET-003 Simplify agent presence by removing command/skill duplication

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-06-27

## Why now
- Commands and skill calls have the same character count today — the command shorthand provides no ergonomic win, creating confusion about which to use
- The commands are not that useful when they don't shorten the invocation

## Alternatives considered
- Remove commands entirely and rely on skill invocations only — single entry point, no duplication (chosen direction)

## Expected outcomes
- Single entry point for all oprim actions within 4 weeks (baseline: dual command + skill surface)

## Kill criteria / rollback trigger
- Users report they can't discover skills without commands as a hint — restore a lightweight command layer

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
