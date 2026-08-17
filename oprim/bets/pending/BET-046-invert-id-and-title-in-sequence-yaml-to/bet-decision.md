# Decision: BET-046 Invert id and title in sequence.yaml to improve visibility

## Status
- Decision: Build now
- Date: 2026-08-17
- Owner: Eshane
- Review date: 2026-09-14

## Why now
- sequence.yaml entries currently list `id:` before `title:` in each bet block. Since the title is the human-readable, scannable part and the ID is mostly a cross-reference key, flipping the field order (title first, then id) would make the board easier to visually parse when skimming now/next/later/backlog — especially as the list grows. This is a small formatting change to the YAML structure itself (and any tooling/templates that generate it), not a data model change.

## Alternatives considered
- <alternative + reason>

## Expected outcomes
- <metric: baseline -> target in timeframe>

## Kill criteria / rollback trigger
- <condition and action>

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
