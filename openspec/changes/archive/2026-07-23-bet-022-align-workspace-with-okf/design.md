## Context

`oprim/templates/{bet-decision,pdr,kpi-review}.md` are plain markdown string constants (`betDecisionTemplate`, `pdrTemplate`, `kpiReviewTemplate` in `packages/cli/src/lib/templates.ts`) written verbatim into a user's project by `oprim init` only (`commands/init.ts:53-56`). `oprim update` does not rewrite these three files — they're treated as user-owned once scaffolded (only `sequenceViewScriptTemplate` and similar generated scripts are rewritten on update). None currently carry YAML frontmatter; each artifact's `type` is implicit in its directory/filename convention.

This differs structurally from the precedent feature-flag work (`pdr-proactive-surfacing`, BET-007): that feature only ever touched `install-agent.ts`-generated skill strings, which `oprim update` regenerates every run, so no persisted config was needed — the installed file set *was* the state. OKF frontmatter touches `templates.ts` files that are init-only, so the opt-in choice must be **persisted** in `oprim/config.yaml` (already the home for other integration toggles, via `configTemplate(projectName, openspecEnabled, graphifyEnabled)` in `templates.ts:1`) so that `update` can consult it when regenerating the skill-instruction text, even though it can't retroactively rewrite already-scaffolded template files.

`openspec/specs/*/spec.md` files are authored directly by AI agents per skill instructions (via `/openspec-propose`) — `install-agent.ts`/`templates.ts` never scaffold spec.md content, so OKF frontmatter for specs is out of scope for this change's code path; it would need separate handling in the openspec-propose skill instructions if pursued later. This change scopes strictly to `bet-decision.md`, `pdr.md`, `kpi-review.md`.

## Goals / Non-Goals

**Goals:**
- Let a user opt in, at `oprim init` time, to OKF-compliant YAML frontmatter (`type`, `title`, `description`, `tags`, `timestamp`) on newly scaffolded `bet-decision.md`, `pdr.md`, and `kpi-review.md` files
- Persist the choice in `oprim/config.yaml` so `oprim update` can keep skill instructions consistent with it
- Generate a prototype `oprim/index.md` OKF bundle entrypoint when enabled, linking the workspace's frontmattered artifacts
- Keep the change purely additive: default OFF, no rewrite of existing/archived artifacts, no change to `criteria.yaml`

**Non-Goals:**
- Rewriting `criteria.yaml` into OKF shape (analysis.md found no fit — it has no prose body to separate frontmatter from)
- Retroactively adding frontmatter to already-scaffolded or archived artifacts
- OKF frontmatter for `openspec/specs/*/spec.md` (out of scope — authored by agents, not `templates.ts`)
- Building a full OKF validator/linter or CI compliance check (a possible future bet, not this one)
- Auto-detecting or wiring external OKF-aware agents/consumers — this change only makes the workspace OKF-shaped, not the discovery/consumption side

## Decisions

**Persist opt-in in `oprim/config.yaml`, unlike the PDR-surfacing precedent**
`configTemplate()` gains a fourth parameter, `okfEnabled: boolean`, rendered as a new top-level `okf: { enabled: <bool> }` block. `oprim init` prompts once (mirroring `promptPdrSurfacing()` in `install-agent.ts:52-55`, guarded the same way `init.ts:109-111` guards the PDR prompt on Claude being selected — OKF frontmatter is agent-agnostic so it SHALL prompt regardless of selected agent) and writes the flag. `oprim update` reads the persisted flag from the existing `oprim/config.yaml` (does not re-prompt, since the only thing update can act on — the skill-instruction text — should just stay consistent with the init-time choice) rather than mirroring PDR-surfacing's re-prompt-every-time pattern.

*Alternative rejected*: No persisted state, mirror PDR-surfacing exactly — doesn't work here because template files are init-only; without persistence, `update` would have no way to know whether frontmatter-aware skill instructions should be installed.

*Alternative rejected*: Re-prompt on every `update` like PDR-surfacing — adds a confirmation the user already answered, for a flag that (unlike PDR-surfacing) also governs already-written files on disk; a single init-time choice with the option to hand-edit `config.yaml` to flip it is simpler and matches the "additive, disk-is-truth" spirit of the templates themselves.

**Two template variants, selected by `init.ts` at write time**
`templates.ts` gains a small `okfFrontmatter(type, titlePlaceholder)` helper that renders the 5-field frontmatter block (`type`, `title`, `description`, `tags`, `timestamp`) as a string. `init.ts` prepends it to `betDecisionTemplate`/`pdrTemplate`/`kpiReviewTemplate` before writing, only when the user opted in. The base template constants themselves are unchanged — frontmatter is composed on top of them at write time, not baked into three duplicate constants.

*Alternative rejected*: Duplicate each template as a `*WithFrontmatterTemplate` constant — doubles the surface area to keep in sync for three templates that otherwise never change together.

**`oprim/index.md` generated only when enabled, listing scaffolded artifacts by type**
When OKF frontmatter is enabled, `oprim init` (and `oprim doctor`, as a repair/regeneration path — out of scope for this change's tasks but noted for design continuity) writes a minimal `oprim/index.md` with OKF `type: index` frontmatter and a body listing links to `bets/`, `decisions/`, `reviews/` directories. This is the "prototype OKF bundle" the bet's analysis called for — it sanity-checks the end-to-end shape without building a full bundle exporter.

*Alternative rejected*: Auto-regenerate `index.md` on every bet/PDR/review creation — adds bookkeeping to three separate skills for marginal freshness benefit; a static entrypoint pointing at the directories (rather than an enumerated file list) avoids needing to keep it in sync at all.

**Skill instructions gain a conditional "include OKF frontmatter" note, not a new shared skill**
Unlike PDR-surfacing (which introduced a whole new `oprim:context` skill), this feature only needs `oprim-bet`, `oprim-pdr`, `oprim-review` to know whether to fill in the frontmatter block already present at the top of the template file they read from `oprim/templates/`. Since the frontmatter (or its absence) is now baked into the template file on disk at init time, the skills need **no new conditional logic at all** — they already read and fill in whatever template exists in `oprim/templates/`. This is the key simplification versus PDR-surfacing: the flag only affects `init.ts` template selection, not `install-agent.ts` skill string generation.

## Risks / Trade-offs

- [Config/template drift if a user hand-edits `oprim/config.yaml`'s `okf.enabled` after init] → Documented as a known limitation; `oprim doctor` could later check consistency (not in this change's scope)
- [Frontmatter `description` field requires a one-line summary that today's artifacts don't have a natural slot for] → Skills prompt for it as a new short field alongside existing title/context prompts, consistent with how `oprim-pdr`/`oprim-bet` already gather structured input
- [Divergence from PDR-surfacing's "no persisted config" precedent could confuse future contributors] → Called out explicitly above with rationale (template files are init-only vs. update-regenerated skill strings)

## Migration Plan

1. Add `okfFrontmatter(type, titleHint)` helper to `templates.ts`; add `okf.enabled` field to `configTemplate()`
2. Add `promptOkfFrontmatter()` (mirroring `promptPdrSurfacing()`) and wire it into `commands/init.ts`'s prompt sequence
3. In `init.ts`, prepend the frontmatter block to `betDecisionTemplate`/`pdrTemplate`/`kpiReviewTemplate` before writing when opted in; write `oprim/index.md` when opted in
4. Update `oprim-bet`, `oprim-pdr`, `oprim-review` skill instructions in `install-agent.ts` to note that a frontmatter block, if present at the top of the template, should be filled in (title/description/tags/timestamp) alongside the existing body sections
5. Run `oprim init` locally (opting in) in a scratch directory to verify the full scaffold — templates, config.yaml, and index.md
6. No data migration — existing projects that don't re-run `init` are unaffected; running `oprim update` on an existing project does not retroactively add frontmatter
7. Rollback: revert `templates.ts`/`init.ts`/`install-agent.ts` changes; existing `oprim/config.yaml` files with an `okf.enabled` key are simply ignored by the reverted code
