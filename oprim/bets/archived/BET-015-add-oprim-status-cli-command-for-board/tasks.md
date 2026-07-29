## 1. Bet template update

- [x] 1.1 Add `## Door type` and `## Risk profile` sections to the `betSkill()` template in `packages/cli/src/lib/install-agent.ts`
- [x] 1.2 Verify the updated template is emitted correctly by running `oprim update` locally and inspecting the generated skill file

## 2. Command scaffolding

- [x] 2.1 Create `packages/cli/src/commands/ovw.ts` with a Commander `Command` export following the pattern in `doctor.ts`
- [x] 2.2 Register `ovwCommand()` in `packages/cli/src/cli.ts`

## 3. sequence.yaml parsing

- [x] 3.1 Read and parse `oprim/sequence.yaml` using `js-yaml` (already a dependency)
- [x] 3.2 Handle missing file: exit non-zero with message "No oprim/sequence.yaml found — run 'oprim init' first"
- [x] 3.3 Handle empty board: print each lane header with "(empty)" and exit 0

## 4. bet-decision.md extraction

- [x] 4.1 Implement `resolveBetDecisionPath(betId)` — scans `oprim/bets/` for a directory starting with the bet ID, returns the path to `bet-decision.md`
- [x] 4.2 Implement `extractDoorType(content)` — regex match for `[x] 2-way door` or `[x] 1-way door`, returns `'2-way' | '1-way' | null`
- [x] 4.3 Implement `extractRiskProfile(content)` — regex match for each of the four risk dimensions, returns `{ value, usability, feasibility, viability }` each as `'Low' | 'Medium' | 'High' | null`
- [x] 4.4 Handle missing or malformed bet-decision.md gracefully — return `{ doorType: null, risks: null }` and display `[risk: unknown]`

## 5. Board rendering

- [x] 5.1 Print each lane (now / next / later / backlog) as a chalk-coloured header
- [x] 5.2 For `now` and `next` bets: print `BET-NNN  Title  [2-way | value:L usability:L feasibility:L viability:L]`
- [x] 5.3 For `later` and `backlog` bets: print `BET-NNN  Title` only
- [x] 5.4 Append `[blocked by: BET-XXX, ...]` inline for bets with a non-empty `blocked_by` list
- [x] 5.5 Abbreviate risk ratings to first letter (L / M / H) for compact display

## 6. Advisory rule engine

- [x] 6.1 Implement board-shape rules: now lane empty, stuck bet, now lane overloaded (>3)
- [x] 6.2 Implement door-type rules: 1-way in now with no 2-way unrisker, all-now-1-way, 2-way after 1-way inversion
- [x] 6.3 Implement risk advisory rules: high value risk on 1-way, elevated feasibility, usability, and viability
- [x] 6.4 Print Advisory section with chalk header only when at least one rule fires; omit entirely if no rules trigger
- [x] 6.5 Rules requiring bet-decision.md data are silently skipped for bets with `[risk: unknown]`

## 7. Tests

- [x] 7.1 Test: board with bets in all lanes renders correct lane grouping
- [x] 7.2 Test: missing `sequence.yaml` exits non-zero with correct error message
- [x] 7.3 Test: empty board prints lane headers with "(empty)"
- [x] 7.4 Test: in-flight bet with complete risk profile renders inline metadata correctly
- [x] 7.5 Test: in-flight bet with missing bet-decision.md shows `[risk: unknown]` and does not crash
- [x] 7.6 Test: blocked bet shows inline blocker annotation after risk metadata
- [x] 7.7 Test: each board-shape nudge rule fires correctly
- [x] 7.8 Test: 1-way door in now with no 2-way unrisker triggers door-type advisory
- [x] 7.9 Test: all-now-1-way rule triggers; 2-way-after-1-way inversion triggers
- [x] 7.10 Test: each risk advisory rule fires for Medium and High, suppressed for Low
- [x] 7.11 Test: Advisory section omitted entirely when no rules fire

## 8. Build verification

- [x] 8.1 Run `npm run build` in `packages/cli/` — no TypeScript errors
- [x] 8.2 Smoke-test: `node dist/cli.js ovw` in this repo prints board state with BET-015's risk profile visible
