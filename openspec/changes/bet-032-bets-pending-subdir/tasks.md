## 1. CLI init scaffolding

- [x] 1.1 `packages/cli/src/commands/init.ts` — create `oprim/bets/pending/` (with `.gitkeep`) instead of `oprim/bets/.gitkeep` directly; keep `oprim/bets/archived/` as-is

## 2. Bet-directory resolution helpers

- [x] 2.1 `packages/cli/src/lib/spec-delta.ts` — `resolveBetDirectory()` scans `oprim/bets/pending/` (not the flat `oprim/bets/`) for a matching bet ID/slug
- [x] 2.2 `packages/cli/src/commands/validate.ts` — `betsDir` computation points at `oprim/bets/pending`
- [x] 2.3 `packages/cli/src/lib/validate-checks.ts` — all three `betsDir` computations (definition-of-done, spec-delta-drift, cross-bet-conflict checks) point at `oprim/bets/pending`
- [x] 2.4 `packages/cli/src/commands/doctor.ts` — `betsDir` computation points at `oprim/bets/pending`
- [x] 2.5 `packages/cli/src/commands/ovw.ts` — `betsDir` computation points at `oprim/bets/pending`
- [x] 2.6 `packages/cli/src/lib/measure.ts` — `betsDir` computation points at `oprim/bets/pending`

## 3. Workflow template text

- [x] 3.1 `packages/cli/src/workflows/bet.template.md` — bet ID scanning and new-bet-directory instructions reference `oprim/bets/pending/`
- [x] 3.2 `packages/cli/src/workflows/archive.template.md` (and `archive.inline.md`) — move source changes from `oprim/bets/<resolved-dir>` to `oprim/bets/pending/<resolved-dir>`; destination `oprim/bets/archived/` unchanged
- [x] 3.3 `packages/cli/src/workflows/promote.openspec.template.md`, `promote.native.template.md`, `promote.none.template.md` — bet ID scanning instructions (note promotion path) reference `oprim/bets/pending/`
- [x] 3.4 `packages/cli/src/workflows/spec-authoring.template.md` — native delta-spec write path reference `oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md`

## 4. Test updates

- [x] 4.1 Update `packages/cli/src/__tests__/` fixtures/assertions that construct or assert `oprim/bets/BET-*` paths to use `oprim/bets/pending/BET-*`
- [x] 4.2 Add/extend a test asserting bet-ID scanning still finds the correct max ID when candidates exist in both `oprim/bets/pending/` and `oprim/bets/archived/`
- [x] 4.3 `npm test` (in `packages/cli/`) passes with no remaining flat-path assumptions

## 5. Repository migration (this workspace)

- [x] 5.1 Move every existing `oprim/bets/BET-*` directory (excluding `archived/`) into `oprim/bets/pending/`
- [x] 5.2 Confirm `oprim/sequence.yaml` entries are untouched (they reference bare `BET-NNN` IDs, not paths)
- [x] 5.3 Run `oprim doctor` and `oprim validate` against this repo and confirm no missing-bet or broken-reference warnings introduced by the move
