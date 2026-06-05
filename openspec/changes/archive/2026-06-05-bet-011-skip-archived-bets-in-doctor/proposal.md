## Why

`oprim doctor` should only surface actionable items. The discovery check in `doctor.ts` scans `oprim/bets/` without explicitly excluding `archived/`, relying on the incidental absence of `bet-decision.md` in the `archived/` parent directory. The criteria scanner in `measure.ts` still reads from `primer/bets/` (the old path) and would also lack explicit archival filtering once corrected. Making the exclusion explicit prevents noise and future regressions as the archived set grows.

## What Changes

- `packages/cli/src/commands/doctor.ts`: Add explicit `if (entry.name === 'archived') continue;` guard in the bet discovery loop (line ~182) so archived bets are never checked for `discovery.md`
- `packages/cli/src/lib/measure.ts`: Fix `scanCriteriaForSourceType` to read from `oprim/bets/` instead of `primer/bets/`, and add an explicit `if (entry === 'archived') continue;` guard so archived bets are excluded from credential requirement checks

## Capabilities

### New Capabilities
- `doctor-archived-bet-exclusion`: Doctor and criteria scanning explicitly skip the `oprim/bets/archived/` subtree so archived bets produce no health-check output

### Modified Capabilities
<!-- No existing spec-level behavior changes -->

## Impact

- `packages/cli/src/commands/doctor.ts` — discovery check loop
- `packages/cli/src/lib/measure.ts` — `scanCriteriaForSourceType` function
- No CLI interface or output format changes for active bets

## Context

Promoted from BET-011. See `oprim/bets/BET-011/bet-decision.md`.
