## Tasks

- [x] Add `sequenceViewScriptTemplate` to `packages/cli/src/lib/templates.ts` — inline YAML parser, no js-yaml dep, `process.cwd()`-relative paths
- [x] Update `packages/cli/src/commands/init.ts` — `ensureDir` for `oprim/scripts/`, `writeFile` for the script, update console output
- [x] Update `packages/cli/src/commands/update.ts` — import scaffold helpers and template, refresh script before agent skills loop
- [x] Update `sequenceContent()` in `packages/cli/src/lib/install-agent.ts` — add step 7 to run the script
- [x] Update `oprimWorkflowsInline()` in `packages/cli/src/lib/install-agent.ts` — add `### Sequencing board (oprim-sequence)` section
- [x] Build and run tests to verify no regressions
