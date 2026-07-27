## Context

`packages/cli/src/lib/install-agent.ts` (~1,560 lines) is the single source of truth for every oprim workflow's content. Each workflow (bet, PDR, note, criteria, review, archive, context, sequence, spec-authoring, promote) has:
- A "body" string literal describing the steps (e.g. `betSkill()`, `pdrSkill()`)
- A Claude-specific wrapper (`claudeWrapper`) that turns the body into a `SKILL.md` + a thin command file
- A Cursor-specific wrapper (`cursorWrapper`) that inlines the body into a single command file
- A Codex/Gemini/Poolside "inline content" variant (`*InlineContent()`) written into `AGENTS.md`/`GEMINI.md` between `<!-- oprim:start -->`/`<!-- oprim:end -->` markers

`oprim update` regenerates all of these from the CLI's compiled TypeScript, so the only way to change a workflow's wording, steps, or behavior is to edit and re-release the CLI. `oprim doctor`'s skill-drift check (`lib/integrity.ts`, capability `doctor-skill-version`) diffs an installed skill file against "the content the current CLI would write" — that comparison is implementation-agnostic and does not need to change.

## Goals / Non-Goals

**Goals:**
- Move each workflow's content out of TypeScript string literals into a declarative `<name>.schema.yaml` + `<name>.template.md` pair.
- Let a project override a single workflow by dropping `oprim/workflows/<name>.schema.yaml` / `<name>.template.md` in its own tree, without forking the CLI or losing updates to the other workflows.
- Preserve byte-for-byte output for every workflow that has no project override, so existing installs see zero diff from this refactor and `oprim doctor` drift checks keep passing.
- Keep the same rendering targets: Claude (skill + command wrapper), Cursor (inline command), Codex/Gemini/Poolside (inline instruction block).

**Non-Goals:**
- Changing the wording, steps, or behavior of any existing workflow (pure architecture change).
- Building a general-purpose plugin system or a marketplace for third-party workflows.
- Changing `oprim/config.yaml`'s schema (workflow overrides are discovered by file presence under `oprim/workflows/`, not declared in config).
- Supporting override of the *rendering* logic itself (only schema/template content is forkable, not how it's projected per agent).

## Decisions

**Schema format: YAML metadata + separate Markdown template, not a single file.**
Keeping metadata (id, title, description, target command name) in YAML and prose in Markdown mirrors OpenSpec's own `instructions`/`template` split, keeps diffs readable, and lets the Markdown be edited by non-engineers without touching structured data. Alternative considered: a single YAML file with a multi-line string body — rejected because multi-line YAML strings are painful to diff and to author in an editor with Markdown tooling.

**Placeholder-based templating, not a full template engine.**
Templates use simple `{{placeholder}}` tokens (e.g. `{{command_name}}`, `{{step_0_context}}`) resolved by the renderer — no conditionals or loops. This matches the actual variability in the current code (mostly: wrap this body for agent X, optionally prepend a context step). Alternative considered: adopt a real template engine (Handlebars/Mustache) — rejected as over-engineering for a fixed, small set of substitution points; would add a new runtime dependency for no behavioral benefit.

**Override resolution: filesystem precedence, resolved at `init`/`update` time, not config-declared.**
`oprim/workflows/<name>.schema.yaml` (if present) wins over the CLI-bundled `packages/cli/src/workflows/<name>.schema.yaml`, matched by filename. This is symmetric with how `install-agent.ts` already treats `oprim/config.yaml`'s optional `agents:` list — presence-based, no separate registration step. Alternative considered: an explicit `workflow_overrides:` map in `oprim/config.yaml` — rejected as unnecessary ceremony; file presence is sufficient and matches the "fork without touching TypeScript" goal from the bet.

**Bundled schemas ship inside the npm package, not fetched remotely.**
`packages/cli/src/workflows/*.schema.yaml` and `*.template.md` are read from disk relative to the compiled CLI (same pattern as existing template strings in `lib/templates.ts`), bundled into the published package. No network dependency, no versioning-skew risk between CLI version and schema version.

**`install-agent.ts` keeps orchestration, loses content.**
`installAgentSkills()` and the `oprim init`/`update` call sites are unchanged in shape; they call the new `renderWorkflow(name, agent)` from `workflow-renderer.ts` instead of calling `betSkill()`, `pdrSkill()`, etc. directly. This keeps the blast radius of the refactor contained to content extraction, not orchestration logic (hooks merging, agent detection, PDR-surfacing Step 0 injection stay where they are).

## Risks / Trade-offs

- **[Risk] Silent output drift during migration** (a template loses a bullet, a placeholder is mis-substituted) → Mitigation: migrate one workflow at a time; for each, diff the renderer's output against the current string-literal output byte-for-byte before deleting the old function; keep this as an explicit task-by-task gate (see tasks.md).
- **[Risk] Project-level override goes stale against CLI upgrades** (a team forks `bet.template.md`, then a later oprim release changes the canonical version and the fork silently diverges) → Mitigation: this is the accepted, intended trade-off of forkability (same trade-off OpenSpec accepts for its own customization model); `oprim doctor`'s existing drift-warning mechanism already surfaces "installed skill differs from what CLI would write" per skill, which will also fire for an intentionally-forked workflow — acceptable since the user opted into the fork.
- **[Risk] Placeholder tokens collide with literal `{{` in authored Markdown** (a workflow body legitimately needs to show `{{` as an example) → Mitigation: none of the current 10 workflows' content contains literal `{{`; if this arises, escape via a documented `\{{` convention rather than redesigning the templating approach.
- **[Trade-off] Losing TypeScript type-checking on workflow content** (string-literal functions get compiler-checked for syntax; YAML/Markdown files do not) → Accepted: `oprim doctor`'s skill-drift check and the migration-time byte-diff gate are the safety net instead of the compiler.

## Migration Plan

1. Build `workflow-schema.ts` (load + override-resolve) and `workflow-renderer.ts` (per-agent render) alongside the existing functions — no call sites changed yet.
2. Migrate workflows one at a time (start with `pdr`, the smallest): extract to schema+template, wire the renderer behind a byte-diff assertion against the old function's output, then delete the old function once verified.
3. Repeat for the remaining 9 workflows.
4. Remove now-dead wrapper helpers (`claudeWrapper`, `cursorWrapper`, `*InlineContent`) once every workflow that used them has migrated, replacing them with equivalent logic inside `workflow-renderer.ts`.
5. No end-user migration step: since output is byte-identical for unmodified installs, `oprim update` on an existing project produces no diff.

## Open Questions

- Should `oprim doctor` gain an explicit "workflow N is project-overridden" informational note (distinct from the existing drift warning) so users can tell a diff is intentional? Deferred — not required for BET-027's kill criteria; can be a follow-up bet if forking is adopted.
