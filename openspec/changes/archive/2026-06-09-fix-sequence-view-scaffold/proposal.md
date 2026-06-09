## Why

The `generate-sequence-view.js` script introduced in 0.3.0 was hand-placed in this repo's `oprim/scripts/` directory but was never wired into the CLI install path. Every `oprim init` since 0.3.0 has silently omitted it. Additionally, `oprim update` never refreshes workspace scripts (only agent skills), so even a manual placement wouldn't survive an update. Finally, the `/oprim:sequence` skill prompt never told the AI to regenerate `oprim/sequence-view.md`, making the file stale after any board change.

## What Changes

- **Added**: `sequenceViewScriptTemplate` in `templates.ts` — the `generate-sequence-view.js` content as a string constant, with `js-yaml` dependency dropped in favour of an inline YAML parser
- **Modified**: `oprim init` — scaffolds `oprim/scripts/` directory and writes `generate-sequence-view.js` alongside templates
- **Modified**: `oprim update` — refreshes `oprim/scripts/generate-sequence-view.js` (same pattern as skill refresh)
- **Modified**: `/oprim:sequence` skill (`sequenceContent()`) — adds a final step to run `node oprim/scripts/generate-sequence-view.js` after validation
- **Modified**: `oprimWorkflowsInline()` (Codex/Gemini) — adds a `### Sequencing board (oprim-sequence)` workflow section including the script-run step, achieving parity with Claude/Cursor

## Capabilities

### Modified Capabilities
- `sequence-view-scaffold`: `oprim init` and `oprim update` now scaffold and refresh the sequence view script
- `sequence-skill`: `/oprim:sequence` (all agents) now regenerates `oprim/sequence-view.md` as its final step

## Impact

- `packages/cli/src/lib/templates.ts` — new `sequenceViewScriptTemplate` export
- `packages/cli/src/commands/init.ts` — `ensureDir` for scripts, `writeFile` for the script
- `packages/cli/src/commands/update.ts` — imports scaffold helpers and template, refreshes script
- `packages/cli/src/lib/install-agent.ts` — `sequenceContent()` step 7 added; `oprimWorkflowsInline()` gains sequence workflow section

## Context

- Root cause identified via git archaeology: script created in commit `19da1f5` (bet-002, 2026-05-29) as a local artifact; CLI install path never updated
- Secondary gap: `oprimWorkflowsInline()` had no sequence workflow at all for Codex/Gemini agents
