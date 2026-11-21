# Design: BET-075 portfolio workspace mode and scaffold

## Context
PDR-001 fixes the portfolio/product boundary. This bet encodes the switch (`mode`) and the layout; every later portfolio bet branches on it.

## Decisions

### 1. `lib/workspace-mode.ts` is the only reader of `mode`
```ts
export type WorkspaceMode = 'product' | 'portfolio';
export function readWorkspaceMode(projectRoot: string): WorkspaceMode; // absent → 'product'
export function validateWorkspaceMode(projectRoot: string, checks: Check[]): void;
```
Commands never read `config.mode` themselves. Raw-text regex read (`/^mode:\s*(\S+)/m`) like `readSpecFramework()` in `config-merge.ts` — no YAML re-dump.

### 2. Product mode is protected by snapshot tests, not by care
Before touching `init.ts`/`update.ts`, add tests that capture the full file tree + contents of `oprim init` (product, each framework) and `oprim update` in temp dirs. These must pass unchanged at the end of the bet. This is the kill-criterion check.

### 3. Portfolio scaffold lives in `lib/portfolio/scaffold.ts`
`scaffoldPortfolio(projectRoot, { okf })` uses `writeFileIfAbsent` for every file. Templates in `lib/portfolio/templates.ts` (kept out of `lib/templates.ts` so product templates diff is zero). `init.ts` gains `--mode <mode>`; when `portfolio`, it skips `promptFrameworkSelection` and passes `none`.

### 4. Directory naming: `oprim/handbook/`, not `context/`
`context` already means three things (`config.context`, `.oprim-context/`, `oprim context`). `oprim/handbook/` is under `oprim/` so products can cite principles/glossary via remote context. People notes go to `wiki/people/` (personal, not exported). Name and people-notes placement confirmed in review (2026-11-21).

### 5. Portfolio-only config merge
`config-merge.ts` gains a second table `PORTFOLIO_SCHEMA_FIELDS = [{ key: 'products', block: 'products: []\n' }]`, applied by `update.ts` only when `readWorkspaceMode() === 'portfolio'`. `mergeConfigSchema()` keeps its signature and output for product configs.

### 6. Checks
`integrity.ts`/`validate.ts` call `validateWorkspaceMode()` and, in portfolio mode, `checkPortfolioScaffold()` (non-required existence) and `checkPortfolioNoSpecs()` (required).

### 7. Mode-gated workflow install
`WorkflowSchema` gains `modes: WorkspaceMode[]` (default both; `spec-authoring` defaults to `['product']`). The hard-coded `CLAUDE_SKILL_WORKFLOW_IDS`, `POOLSIDE_SKILL_WORKFLOW_IDS`, `CURSOR_SKILL_WORKFLOW_IDS`, `CURSOR_COMMAND_WORKFLOW_IDS` (`install-agent.ts:271-287`) and `INLINE_SECTION_ORDER` (`workflow-renderer.ts:5`) become `workflowIdsFor(agentTarget, mode)`, computed from bundled schemas. Ordering is preserved by an explicit `order:` integer in each bundled schema (today's list positions), so product output stays byte-identical. Done here, not in BET-080, because BET-077's `oprim-objective` is the first portfolio-only workflow.

## Alternatives considered
- Put `STATE.md`/`inbox.md` under `oprim/pm/` — rejected: remote context would export them to every product.
- Write `mode: product` into every config on update — rejected (needless diff in every product repo).

## Risks
- `init.ts` prompt flow is order-sensitive (OKF → framework → agents); skipping the framework prompt must not shift other prompts. Covered by the snapshot tests.
- Deriving install lists from schemas touches every agent's install path at once. The product install parity snapshot (task 1.3) is the guard; if parity can't be held, fall back to keeping the hard-coded lists and appending a portfolio-only list.
