## 1. Foundation

- [ ] 1.1 Create `packages/cli/src/workflows/` directory to hold bundled `<name>.schema.yaml` / `<name>.template.md` pairs
- [ ] 1.2 Define the schema shape (id, title, description, command name) and write `workflow-schema.ts`: loads a workflow's schema+template, resolving `oprim/workflows/<name>.{schema.yaml,template.md}` project overrides over the bundled default (independently per file)
- [ ] 1.3 `workflow-schema.ts`: fail with an actionable error (naming the file) when a project-level override exists but fails to parse or is missing required fields
- [ ] 1.4 Write `workflow-renderer.ts`: given a resolved schema+template, render Claude (`SKILL.md` + command wrapper), Cursor (inline command), and Codex/Gemini/Poolside (inline instruction block) output, replacing `claudeWrapper`/`cursorWrapper`/`*InlineContent` per workflow as each migrates
- [ ] 1.5 Add a migration-time byte-diff test helper that renders a workflow via the new renderer and asserts equality against the current string-literal function's output, for use while migrating each workflow below

## 2. Migrate workflows (one at a time, smallest first)

- [ ] 2.1 Migrate `pdr` (from `pdrSkill()`): extract schema+template, wire renderer, byte-diff against old output, delete `pdrSkill()`
- [ ] 2.2 Migrate `note` (from `noteSkill()`)
- [ ] 2.3 Migrate `criteria` (from `criteriaSkill()`)
- [ ] 2.4 Migrate `review` (from `reviewSkill()`)
- [ ] 2.5 Migrate `archive` (from `archiveSkill()` and `archiveCommandContent()`)
- [ ] 2.6 Migrate `context` (from `oprimContextSkill()` and `contextInitSkill()`)
- [ ] 2.7 Migrate `sequence` (from `oprimSequenceSkill()`, `sequenceContent()`, `sequenceInlineContent()`)
- [ ] 2.8 Migrate `spec-authoring` (from `specAuthoringSkill()`)
- [ ] 2.9 Migrate `promote` (from `promoteContent()`)
- [ ] 2.10 Migrate `bet` (from `betSkill()`) — do last since it's the largest and interacts with PDR-surfacing Step 0 injection

## 3. Cross-cutting behavior preservation

- [ ] 3.1 Confirm PDR-surfacing Step 0 injection (`withContextStep`/`addContextStepToFile`/`removeContextStepFromFile`) still applies correctly to the renderer-produced `bet` Claude skill
- [ ] 3.2 Confirm `mergeClaudeSettingsHooks` and hook registration (`hooksConfig`) are untouched by the migration (they are not per-workflow content)
- [ ] 3.3 Update `oprim doctor`'s skill-drift check (`lib/integrity.ts`) call site, if needed, to source "content the current CLI would write" from the renderer instead of the old string-literal functions
- [ ] 3.4 Run the full existing doctor/skill-drift test suite and confirm no new warnings appear for an unmodified project

## 4. Cleanup

- [ ] 4.1 Remove now-unused wrapper helpers (`claudeWrapper`, `cursorWrapper`, `*InlineContent` functions) once every workflow that used them has migrated
- [ ] 4.2 Remove the migrated string-literal functions and any now-dead imports from `install-agent.ts`
- [ ] 4.3 Update `installAgentSkills()` and the `init`/`update` command call sites to call `workflow-renderer.ts` exclusively

## 5. Testing & verification

- [ ] 5.1 Add unit tests for `workflow-schema.ts` override resolution (bundled only, override schema only, override template only, override both, malformed override)
- [ ] 5.2 Add unit tests for `workflow-renderer.ts` covering all three agent output shapes (Claude, Cursor, Codex/Gemini/Poolside inline)
- [ ] 5.3 Add an integration test: `oprim init` + `oprim update` on a fresh temp project produces output byte-identical to a pre-refactor snapshot for every workflow
- [ ] 5.4 Add an integration test: a project-level `oprim/workflows/<name>.template.md` override is picked up by `oprim update` and reflected in the installed skill file
- [ ] 5.5 Run `npm test` in `packages/cli/` and confirm the full suite passes

## 6. Documentation

- [ ] 6.1 Update `CLAUDE.md`'s "Key design: skills as code" section to describe the new schema+template source of truth and override mechanism (superseding the "lives as string constants in `install-agent.ts`" description)
- [ ] 6.2 Add a short note (e.g. in package README or CLAUDE.md) documenting how a project forks a single workflow via `oprim/workflows/<name>.schema.yaml` / `<name>.template.md`
