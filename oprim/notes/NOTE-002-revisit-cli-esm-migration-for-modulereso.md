---
type: note
title: "Revisit CLI ESM migration for moduleResolution deprecation"
tags: [tech-debt]
timestamp: 2026-08-03
---

# Note: Revisit CLI ESM migration for moduleResolution deprecation

`packages/cli/tsconfig.json` currently suppresses TypeScript's `moduleResolution=node10` deprecation warning via `"ignoreDeprecations": "5.0"` instead of fixing it, because migrating to `moduleResolution`/`module: "Node16"` breaks the build — 8 files (`context.ts`, `doctor.ts`, `init.ts`, `measure.ts`, `migrate.ts`, `ovw.ts`, `update.ts`, `validate.ts`, `install-agent.ts`) `require()` `chalk`, which is ESM-only, and `Node16` resolution refuses to `require()` an ESM package from CommonJS.

The real fix requires either converting the CLI to ESM (`package.json` `"type": "module"`) or switching all `chalk` imports to dynamic `import()`. `ignoreDeprecations` will stop working once TypeScript 7.0 ships, so this needs to be revisited before then.

## Bets
- None
