## 1. Product-mode safety net

- [x] 1.1 Add snapshot tests for `oprim init` (product mode, each spec framework, OKF on/off) capturing the full file tree and contents in a temp dir
- [x] 1.2 Add snapshot test for `oprim update` on an existing product workspace (config.yaml unchanged when schema is current)
- [x] 1.3 Add install-parity snapshot: `oprim update` with every agent selected, full tree of installed skills/commands/instruction files

## 2. Mode key

- [x] 2.1 Create `lib/workspace-mode.ts` with `readWorkspaceMode()` (absent → `product`) and `validateWorkspaceMode()`
- [x] 2.2 Tests: absent key, `product`, `portfolio`, invalid value → required failure

## 3. Portfolio scaffold

- [x] 3.1 Create `lib/portfolio/templates.ts` with handbook/STATE/inbox/wiki templates, OKF and non-OKF variants
- [x] 3.2 Create `lib/portfolio/scaffold.ts` (`scaffoldPortfolio`) using `writeFileIfAbsent`
- [x] 3.3 Add `--mode <product|portfolio>` to `commands/init.ts`; in portfolio mode skip the framework prompt, write `spec_framework: none` and `mode: portfolio`
- [x] 3.4 Tests: fresh portfolio init tree; re-run preserves edited files; OKF on/off frontmatter

## 4. Config merge

- [x] 4.1 Add `PORTFOLIO_SCHEMA_FIELDS` + `mergePortfolioConfigSchema()` to `config-merge.ts`
- [x] 4.2 Call it from `commands/update.ts` only when mode is portfolio
- [x] 4.3 Tests: portfolio config gains `products: []` with other lines untouched; product config gains nothing

## 5. Checks

- [x] 5.1 `checkPortfolioScaffold()` (non-required existence of root personal files) in doctor
- [x] 5.2 `checkPortfolioNoSpecs()` (required: `spec_framework` must be `none`, no `specs/` under pending bets) in doctor and validate
- [x] 5.3 Test: remote-context `assembleOprimWorkspaceContent` on a portfolio workspace excludes root personal files

## 6. Mode-gated workflow install

- [x] 6.1 Add optional `modes` (+ `order`) to `WorkflowSchema`/`parseSchema`, with `spec-authoring` defaulting to `[product]`; actionable error on invalid values
- [x] 6.2 Add `order:` to every bundled schema matching today's list positions
- [x] 6.3 Replace hard-coded workflow ID lists in `install-agent.ts` and `workflow-renderer.ts` with `workflowIdsFor(target, mode)`
- [x] 6.4 Tests: install-parity snapshot (1.3) unchanged; portfolio-only fixture workflow skipped in product mode, installed in portfolio mode; override can change `modes`

## 7. Docs

- [x] 7.1 README: `oprim init --mode portfolio` section and layout tree
- [x] 7.2 CLAUDE.md: `lib/workspace-mode.ts`, `lib/portfolio/` in source layout; authority boundary paragraph pointing at PDR-001
- [x] 7.3 Confirm full existing test suite passes unchanged
