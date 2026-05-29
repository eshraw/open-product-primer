## Why

Users naturally invoke `oprim` skills and commands — the branding is already established in practice. But the CLI banner, command descriptions, and help text still say "Open Product Primer" while the binary says `oprim`. This split forces every new user to learn two names in their first session, and creates confusion about which name to use where.

The bet decision (BET-004) chose a clean rule: the repo stays `open-product-primer`; all user-facing CLI and agent surfaces use `oprim` exclusively.

## What Changes

- **Modified**: `packages/cli/src/cli.ts` — program name changed from `open-product-primer` to `oprim` in Commander `.name()`; description updated to lead with `oprim`
- **Modified**: `packages/cli/src/commands/init.ts` — command description and console banner replace "Open Product Primer" with `oprim`
- **Modified**: `packages/cli/src/commands/doctor.ts` — command description and console banner replace "Open Product Primer" with `oprim`
- **Modified**: `packages/cli/src/lib/templates.ts` — README template heading and intro replace "Open Product Primer" with `oprim`

## Capabilities

### Modified Capabilities
- `project-installation`: `oprim init` output banner and description now say `oprim` instead of "Open Product Primer"

## Impact

- `packages/cli/src/cli.ts` — `.name('open-product-primer')` → `.name('oprim')`; description updated
- `packages/cli/src/commands/init.ts` — 2 string changes (description + console.log banner)
- `packages/cli/src/commands/doctor.ts` — 2 string changes (description + console.log banner)
- `packages/cli/src/lib/templates.ts` — README template text updated (heading + intro paragraph)
- No behavioral changes; all `primer/` directory paths and file paths unchanged
- No breaking changes to existing repos

## Context

- **Bet**: `primer/bets/BET-004/bet-decision.md` — "Double down on oprim branding over primer"
- **Decision date**: 2026-05-27
- **Owner**: Eshane
- **Scope boundary**: repo name (`open-product-primer`), npm package name, and the `primer/` directory tree are intentionally NOT renamed — only user-visible strings in CLI output and help text change
