## Why

BET-004 consolidated all user-facing CLI strings to `oprim`, but the workspace directory is still called `primer/` — a hidden convention with no connection to the tool name. New users see `primer/` and have no idea what it is without reading docs. Renaming it to `oprim/` makes the directory self-describing and consistent with the binary. Acting now while adoption is early minimizes migration blast radius.

## What Changes

- **Modified**: `oprim init` creates `oprim/` instead of `primer/` as the workspace root, including all subdirectories (`decisions/`, `bets/`, `reviews/`, `templates/`) and config files (`oprim/config.yaml`, `oprim/sequence.yaml`)
- **Modified**: `oprim doctor` validates the `oprim/` scaffold instead of `primer/`
- **Modified**: All internal path construction updated from `primer/` to `oprim/` (variable names like `primerDir` unchanged — only the path string changes)
- **Added**: `oprim migrate` command that detects a `primer/` directory in the project root and renames it to `oprim/`, for existing repos upgrading from earlier versions
- **Modified**: The `primer/` directory in this repo (`open-product-primer`) renamed to `oprim/`
- **BREAKING**: Existing repos using `primer/` must run `oprim migrate` to continue using oprim CLI commands

## Capabilities

### New Capabilities
- `project-migration`: A one-time `oprim migrate` command that detects `primer/` and renames it to `oprim/`, reporting what was moved

### Modified Capabilities
- `project-installation`: `oprim init` workspace root changes from `primer/` to `oprim/`; `oprim doctor` scaffold checks updated to `oprim/`

## Impact

- `packages/cli/src/commands/init.ts` — all `primer/` path strings → `oprim/`
- `packages/cli/src/commands/doctor.ts` — all `primer/` scaffold checks → `oprim/`
- `packages/cli/src/commands/` — new `migrate.ts` command
- `packages/cli/src/cli.ts` — register `migrateCommand()`
- `packages/cli/src/lib/detect.ts` — any `primer/` path references → `oprim/`
- `primer/` directory in repo root renamed to `oprim/`
- Breaking change for existing repos — migration path required

## Context

- Bet: `primer/bets/BET-010/bet-decision.md`
- Decision date: 2026-05-29
- Owner: Eshane
