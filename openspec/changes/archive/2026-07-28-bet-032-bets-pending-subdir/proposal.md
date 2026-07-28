## Why

Native mode's `/oprim:archive` folds a spec delta into `oprim/specs/` the moment a bet is archived, but a flat `oprim/bets/BET-NNN/` sitting next to `oprim/bets/archived/` gives no mid-state signal — there's no way to tell, from the filesystem alone, which bets are specced-but-not-yet-built versus already shipped. The only distinction lives implicitly in `sequence.yaml` board position, and that entry is deleted entirely on archive. Fixing this now avoids a painful migration across many bet directories once more teams adopt the native framework.

## What Changes

- Introduce `oprim/bets/pending/` as the location for all not-yet-archived bets; `oprim-bet` creates new bets at `oprim/bets/pending/BET-NNN-<slug>/` instead of directly under `oprim/bets/`
- Update `oprim:archive` to move a bet from `oprim/bets/pending/BET-NNN-<slug>/` to `oprim/bets/archived/BET-NNN-<slug>/` (source path changes; destination unchanged)
- Update native spec-authoring (`spec-dir-lifecycle`) so an active bet's delta spec is written under `oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md`
- Update every path-resolution point in `packages/cli/src/lib/install-agent.ts` and the `oprim-bet`, `oprim-promote` (this command), `oprim-archive`, and `oprim-spec` workflow templates for the new `pending/` segment
- Migrate this repository's own existing flat `oprim/bets/BET-NNN-<slug>/` directories into `oprim/bets/pending/` as part of implementation, so the workspace itself is left in a consistent state
- **BREAKING**: any external tooling or scripts that hardcode `oprim/bets/BET-NNN/` paths (bypassing the CLI/skills) will need to add the `pending/` segment

## Capabilities

### New Capabilities
- `bet-pending-lifecycle`: `oprim/bets/pending/` holds all not-yet-archived bets, giving an at-a-glance built-vs-in-flight signal via `ls oprim/bets/pending/` vs `ls oprim/bets/archived/`, with bet-ID scanning spanning both `pending/` and `archived/`

### Modified Capabilities
- `bet-authoring`: `oprim-bet` creates new bet directories at `oprim/bets/pending/BET-NNN-<slug>/` instead of `oprim/bets/BET-NNN-<slug>/`
- `bet-archiving`: `oprim:archive` moves a bet from `oprim/bets/pending/BET-NNN-<slug>/` (not `oprim/bets/BET-NNN-<slug>/`) to `oprim/bets/archived/BET-NNN-<slug>/`
- `spec-dir-lifecycle`: an active bet's native spec delta is written under `oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md` instead of `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md`

## Impact

- `packages/cli/src/lib/install-agent.ts` — bet path resolution/scanning logic
- `packages/cli/src/workflows/bet.template.md`, `promote.openspec.template.md`, `promote.native.template.md`, `archive.template.md`, `spec-authoring.template.md` — path references in instructional text
- `packages/cli/src/lib/integrity.ts`, `lib/validate-checks.ts`, `lib/spec-delta.ts` — any bet-directory scanning used by `doctor`/`validate`
- `packages/cli/src/__tests__/` — path-dependent test fixtures and assertions
- This repository's own `oprim/bets/BET-*` directories (excluding `archived/`) — moved under `oprim/bets/pending/` as part of the migration
- No new dependencies or infrastructure; pure filesystem + instructional-text change (2-way door)

## Context

- Bet: BET-032 (`oprim/bets/BET-032-move-active-bets-into-a-pending-sub-dir/bet-decision.md`) — Move active bets into a pending sub-dir for build-status visibility
