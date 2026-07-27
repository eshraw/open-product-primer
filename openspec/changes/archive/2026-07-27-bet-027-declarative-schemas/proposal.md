## Context

Originating bet: `BET-027` (`oprim/bets/BET-027-move-oprim-workflows-to-declarative/bet-decision.md`)
Relates to: `BET-023` (native spec authoring), `BET-025` (config schema merge), `BET-028` (`oprim validate` w/ strict CI gating, built in parallel on this branch)

## Why

`oprim`'s workflow content (bet / PDR / note / criteria / review / archive / context / sequence / spec-authoring skills and commands) lives as ~1,500 lines of hard-coded string-literal functions in `packages/cli/src/lib/install-agent.ts`. Every skill's instructions are baked into TypeScript, so `oprim update` can only ever regenerate the CLI's own fixed content — a team cannot fork or customize a workflow's wording, steps, or template without patching the CLI source itself. OpenSpec's own schema + template + `instructions` architecture (declarative artifact definitions the CLI renders on demand) proves this can be done without sacrificing multi-agent output. Now is the right time: BET-023 (native spec authoring) and BET-025 (config schema merge) have already validated the declarative-config direction this repo is moving toward.

## What Changes

- Introduce a declarative workflow-schema format: one `<name>.schema.yaml` + `<name>.template.md` pair per oprim workflow artifact (bet, pdr, note, criteria, review, archive, context, sequence, spec-authoring, promote), replacing the corresponding string-literal functions (`betSkill()`, `pdrSkill()`, `noteSkill()`, etc.) in `install-agent.ts`.
- Add a rendering layer that assembles the final per-agent output (Claude skill file + command wrapper, Cursor inline command, Codex/Gemini/Poolside inline instruction block) from a schema+template pair, replacing the per-tool wrapper functions (`claudeWrapper`, `cursorWrapper`, the `*InlineContent()` functions).
- Support project-level overrides: a project may place `oprim/workflows/<name>.schema.yaml` and/or `<name>.template.md` in its own tree; `oprim update`/`oprim init` prefer the project-local file over the CLI-bundled one when both exist, so a team can fork a single workflow without touching TypeScript or losing updates to the others.
- `oprim update` and `oprim init` call the renderer instead of the removed per-workflow string-literal functions. Output content for the default (non-overridden) case is unchanged — this is an internal architecture change, not a behavior change, so existing installed skills continue to pass the `oprim doctor` drift check untouched.
- **BREAKING** (internal API only, not user-facing): `install-agent.ts` no longer exports per-skill string-literal functions (e.g. `pdrSkill`, `betSkill`); anything depending on those exports (only this package) must use the new renderer.

## Capabilities

### New Capabilities
- `workflow-schema-authoring`: declarative YAML schema + Markdown template format for defining an oprim workflow artifact's steps, rules, and content, including project-level override resolution so a team can fork a single workflow without editing CLI TypeScript.
- `workflow-adapter-rendering`: rendering a workflow schema+template pair into the per-agent output format (Claude skill + command wrapper, Cursor command, Codex/Gemini/Poolside inline instruction block) that `oprim init`/`oprim update` write to disk.

### Modified Capabilities
(none — `doctor-skill-version` and `project-installation` requirements are phrased in terms of observable CLI behavior, which is unchanged by this refactor)

## Impact

- `packages/cli/src/lib/install-agent.ts` — most per-skill string-literal functions removed; replaced by calls into the new renderer
- New: `packages/cli/src/lib/workflow-schema.ts` (schema/template loading + override resolution) and `packages/cli/src/lib/workflow-renderer.ts` (per-agent rendering)
- New: `packages/cli/src/workflows/*.schema.yaml`, `packages/cli/src/workflows/*.template.md` (bundled default definitions, one pair per workflow artifact)
- `packages/cli/src/commands/init.ts`, `packages/cli/src/commands/update.ts` — call the renderer instead of the removed functions
- `packages/cli/src/lib/integrity.ts` (`oprim doctor` skill-drift check) — no requirement change, but its "content the current CLI would write" comparison now sources from the renderer instead of a string literal
- No change to `oprim/config.yaml` schema, sequencing board, or bet/PDR/review authoring commands themselves
- Relates to: BET-023 (native spec authoring), BET-025 (config schema merge), BET-028 (`oprim validate` w/ strict CI gating, built in parallel on this branch)
