## 1. Update init command paths

- [x] 1.1 In `packages/cli/src/commands/init.ts`, change `path.join(projectRoot, 'primer')` to `path.join(projectRoot, 'oprim')` for the workspace root variable
- [x] 1.2 Update all `ensureDir` calls to use `oprim/decisions`, `oprim/bets`, `oprim/reviews`, `oprim/templates`
- [x] 1.3 Update `writeFileIfAbsent` calls for `oprim/config.yaml` and `oprim/sequence.yaml`
- [x] 1.4 Update all `console.log` output strings that reference `primer/` to show `oprim/`

## 2. Update doctor command paths

- [x] 2.1 In `packages/cli/src/commands/doctor.ts`, update the scaffold directory check list from `['primer', 'primer/decisions', 'primer/bets', 'primer/reviews', 'primer/templates']` to `['oprim', 'oprim/decisions', 'oprim/bets', 'oprim/reviews', 'oprim/templates']`
- [x] 2.2 Update `configPath` to point to `oprim/config.yaml`
- [x] 2.3 Update `sequenceExists` check to `oprim/sequence.yaml`
- [x] 2.4 Add a check: if `primer/` exists and `oprim/` does not, push a failed check with note `"Run 'oprim migrate' to rename primer/ to oprim/"`

## 3. Update detect and other lib paths

- [x] 3.1 In `packages/cli/src/lib/detect.ts`, update any `primer/` path references to `oprim/`
- [x] 3.2 In `packages/cli/src/lib/install-agent.ts`, audit all skill and command content strings for hardcoded `primer/` references and update to `oprim/`

## 4. Add migrate command

- [x] 4.1 Create `packages/cli/src/commands/migrate.ts` implementing `oprim migrate`: detect `primer/` → rename to `oprim/`, handle already-migrated and neither-exists cases with appropriate messages and exit codes
- [x] 4.2 In `packages/cli/src/cli.ts`, import `migrateCommand` and register it with `program.addCommand(migrateCommand())`

## 5. Rename primer/ in this repo

- [x] 5.1 Rename the `primer/` directory to `oprim/` in the repository root (git mv)
- [x] 5.2 Verify all relative references in README or docs that point to `primer/` are updated

## 6. Version bump

- [x] 6.1 Bump `packages/cli/package.json` version to `0.2.0` (breaking change)
- [x] 6.2 Add `0.2.0` entry to `packages/cli/CHANGELOG.md` documenting the breaking rename and migration path

## 7. Verification

- [x] 7.1 Run `npm run build` in `packages/cli/` and confirm clean compile
- [x] 7.2 Run `oprim init` in a temp directory and confirm `oprim/` is created (not `primer/`)
- [x] 7.3 Run `oprim doctor` and confirm it checks `oprim/` scaffold
- [x] 7.4 Run `oprim migrate` in a repo with `primer/` and confirm rename succeeds
- [x] 7.5 Run `npm test` in `packages/cli/` and confirm all tests pass (update any tests referencing `primer/`)

---
## Context

Path strings change from `primer/` to `oprim/`; internal variable names (`primerDir`, `primerConfig`) remain unchanged. No dual-directory fallback — migration is explicit via `oprim migrate`.

Bet reference: `primer/bets/BET-010/bet-decision.md`
