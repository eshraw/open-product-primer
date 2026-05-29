## 1. CLI Program Name and Description

- [ ] 1.1 In `packages/cli/src/cli.ts`, change `.name('open-product-primer')` to `.name('oprim')`
- [ ] 1.2 In `packages/cli/src/cli.ts`, update `.description('Open Product Primer — product decisions, sequencing, and KPI tracking')` to `.description('oprim — product decisions, sequencing, and KPI tracking')`

## 2. init Command

- [ ] 2.1 In `packages/cli/src/commands/init.ts`, update command `.description('Initialize Open Product Primer in the current repository')` to `.description('Initialize oprim in the current repository')`
- [ ] 2.2 In `packages/cli/src/commands/init.ts`, update `console.log(chalk.bold('Open Product Primer') + ' — initializing project workspace...\n')` to `console.log(chalk.bold('oprim') + ' — initializing project workspace...\n')`

## 3. doctor Command

- [ ] 3.1 In `packages/cli/src/commands/doctor.ts`, update command `.description('Check Open Product Primer install health and integration readiness')` to `.description('Check oprim install health and integration readiness')`
- [ ] 3.2 In `packages/cli/src/commands/doctor.ts`, update `console.log(chalk.bold('Open Product Primer') + ' — health check\n')` to `console.log(chalk.bold('oprim') + ' — health check\n')`

## 4. README Template

- [ ] 4.1 In `packages/cli/src/lib/templates.ts`, locate the README template string and update the `# Open Product Primer` heading to `# oprim`
- [ ] 4.2 Update the intro sentence in the README template that says "Open Product Primer (`open-product-primer`, short **`oprim`**)" to lead with `oprim` — e.g. "**`oprim`** stores product decisions, sequencing, and KPI outcomes under `primer/` in the repo."

## 5. Verification

- [ ] 5.1 Run `npm run build` in `packages/cli/` and confirm it compiles without errors
- [ ] 5.2 Run `oprim --help` and confirm the program name and description show `oprim`, not "Open Product Primer"
- [ ] 5.3 Run `oprim init --help` and `oprim doctor --help` and confirm descriptions show `oprim`
- [ ] 5.4 Run existing tests (`npm test` in `packages/cli/`) and confirm all pass

---
## Context

Replace all user-visible "Open Product Primer" strings with `oprim`. Do NOT rename `primer/` directory paths, variable names (`primerDir`, `primerConfig`), or internal identifiers — those are not user-facing and are out of scope per the design decision.

Bet reference: `primer/bets/BET-004/bet-decision.md`
