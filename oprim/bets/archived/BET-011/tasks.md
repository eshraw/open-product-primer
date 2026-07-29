## 1. Fix scanCriteriaForSourceType

- [x] 1.1 In `packages/cli/src/lib/measure.ts:283`, change `primer/bets` → `oprim/bets`
- [x] 1.2 In the `readdirSync` loop (line ~285), add `if (entry === 'archived') continue;` before the `criteriaPath` lookup

## 2. Fix doctor discovery check

- [x] 2.1 In `packages/cli/src/commands/doctor.ts:181`, add `if (entry.name === 'archived') continue;` at the top of the bet loop body, before the `hasDecision` check

## 3. Tests

- [x] 3.1 In the doctor integration test, add a case where `oprim/bets/archived/BET-XXX/bet-decision.md` exists (without `discovery.md`) and assert no discovery check appears in the output
- [x] 3.2 Add a test for `scanCriteriaForSourceType` that places a `criteria.yaml` in `oprim/bets/archived/BET-XXX/` and asserts the function returns `false`
- [x] 3.3 Add a test for `scanCriteriaForSourceType` that places a `criteria.yaml` in `oprim/bets/BET-007/` and asserts the function returns `true`
- [x] 3.4 Run `npm test` from `packages/cli/` and confirm all tests pass
