## 1. Config and template plumbing

- [x] 1.1 Add `okfFrontmatter(type, titleHint)` helper to `packages/cli/src/lib/templates.ts` that renders the 5-field YAML frontmatter block (`type`, `title`, `description`, `tags`, `timestamp`)
- [x] 1.2 Add `okfEnabled: boolean` parameter to `configTemplate()` in `templates.ts`, rendering a new `okf: { enabled: <bool> }` block in `oprim/config.yaml`
- [x] 1.3 Add an `oprim/index.md` template/generator (OKF `type: index` frontmatter, links to `bets/`, `decisions/`, `reviews/`)

## 2. Init flow

- [x] 2.1 Add `promptOkfFrontmatter()` to `packages/cli/src/lib/install-agent.ts`, mirroring `promptPdrSurfacing()`
- [x] 2.2 Wire the prompt into `commands/init.ts`'s prompt sequence (agent-agnostic — not gated on Claude selection, unlike the PDR-surfacing prompt)
- [x] 2.3 In `init.ts`, prepend the frontmatter block to `betDecisionTemplate`/`pdrTemplate`/`kpiReviewTemplate` before writing when opted in; leave `criteriaTemplate` untouched
- [x] 2.4 In `init.ts`, write `oprim/index.md` when opted in
- [x] 2.5 Pass `okfEnabled` into `configTemplate()` when writing `oprim/config.yaml`

## 3. Update flow

- [x] 3.1 In `commands/update.ts`, read `okf.enabled` from the existing `oprim/config.yaml` (no re-prompt)
- [x] 3.2 Ensure `update` does not rewrite already-scaffolded `oprim/templates/*.md` files regardless of the flag value (preserve current update behavior for these three files)

## 4. Skill instruction updates

- [x] 4.1 Update `oprim-bet` skill instructions in `install-agent.ts` to fill in a frontmatter block if present at the top of `oprim/templates/bet-decision.md`
- [x] 4.2 Update `oprim-pdr` skill instructions in `install-agent.ts` to fill in a frontmatter block if present at the top of `oprim/templates/pdr.md`
- [x] 4.3 Update `oprim-review` skill instructions in `install-agent.ts` to fill in a frontmatter block if present at the top of `oprim/templates/kpi-review.md`

## 5. Verification

- [x] 5.1 Run `oprim init` in a scratch directory, opting in — verify `oprim/config.yaml` has `okf.enabled: true`, all three templates carry frontmatter, `criteria.yaml` does not, and `oprim/index.md` exists
- [x] 5.2 Run `oprim init` in a scratch directory, declining — verify no frontmatter, no `okf` config block regression, no `index.md`, output identical to pre-change behavior
- [x] 5.3 Run `oprim update` against each scratch directory — verify the persisted flag is respected and the three template files are not rewritten
- [x] 5.4 Add/extend Vitest coverage in `packages/cli/src/__tests__/` for the new `configTemplate` parameter and template frontmatter helper
- [x] 5.5 Manually scaffold one bet, one PDR, and one KPI review in the opted-in scratch directory and confirm frontmatter is filled in correctly
