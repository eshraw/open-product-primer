## Why

`oprim doctor` only checks file and directory existence — it never validates the semantic state of the workspace. WIP limits, `blocked_by`/`unlocks` references, and installed skill versions are never verified, so invalid or drifted state accumulates silently until it causes confusion.

## What Changes

- Add a **sequence integrity check** to `oprim doctor`: validates WIP limits and `blocked_by`/`unlocks` reference integrity in `sequence.yaml`
- Add a **skill version drift check** to `oprim doctor`: compares installed skill version strings against the CLI's bundled versions and warns on mismatch
- Both checks run automatically as part of `oprim doctor` (no new subcommand)

## Capabilities

### New Capabilities
- `doctor-sequence-integrity`: Doctor validates WIP limit and cross-reference integrity in `sequence.yaml` (flagging violations and dangling references)
- `doctor-skill-version`: Doctor compares installed skill files against the CLI's bundled versions and warns when they are out of sync

### Modified Capabilities
<!-- No existing requirement-level spec changes needed -->

## Impact

- `packages/cli/src/commands/doctor.ts` — new check functions added
- `packages/cli/src/lib/detect.ts` or a new `lib/integrity.ts` — sequence and skill scan logic
- `packages/cli/__tests__/` — new test cases for each check
- No breaking changes; new warnings are additive to existing doctor output

## Context

- Bet: BET-016 (`oprim/bets/BET-016-extend-oprim-doctor-with-integrity-checks/bet-decision.md`) — Extend oprim doctor with integrity checks for sequence and skills
