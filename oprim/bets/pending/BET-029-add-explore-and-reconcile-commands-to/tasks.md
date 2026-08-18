# Tasks: explore-reconcile-commands

## 1. `explore` command
- [x] 1.1 Author `packages/cli/src/workflows/explore.schema.yaml` (skillName, title, description, per-agent targets)
- [x] 1.2 Author `packages/cli/src/workflows/explore.template.md` — guided investigation flow: surface related PDRs/notes/bets, compare candidate framings, hand off to `/oprim:bet`
- [x] 1.3 Author `explore.inline.md` for Codex/Gemini/Poolside/Vibe/Qwen/Kimi rendering (no `explore.cursor-command.md` — explore is not Cursor-accessible, matching `archive`'s precedent: `cursor.skill: false`, `cursor.command: null`)
- [x] 1.4 Verify explore never writes `bet-decision.md` (read-only investigation only) — confirmed in the template steps and via test assertion

## 2. `reconcile` command
- [x] 2.1 Author `packages/cli/src/workflows/reconcile.schema.yaml`
- [x] 2.2 Author `packages/cli/src/workflows/reconcile.template.md` — link-staleness detection across PDR ↔ bet ↔ review, one fix proposal at a time
- [x] 2.3 Define detection rules: bet's `## Links` PDR/Notes/Spec-delta/OpenSpec-change references, and review filename → bet existence (criteria.yaml needs no separate check — it travels with its bet directory)
- [x] 2.4 Implement per-item confirm-then-fix flow (no batch auto-apply)
- [x] 2.5 Author `reconcile.inline.md` (no `reconcile.cursor-command.md`, same reasoning as 1.3)

## 3. Installation wiring
- [x] 3.1 Register both workflows in `install-agent.ts` (`CLAUDE_SKILL_WORKFLOW_IDS`, `POOLSIDE_SKILL_WORKFLOW_IDS`, `CLAUDE_COMMAND_WORKFLOWS`, and `workflow-renderer.ts`'s `INLINE_SECTION_ORDER`) so `oprim init`/`update` install them for all supported agents
- [x] 3.2 `oprim doctor`'s skill-version-drift check — no code change needed: `CLAUDE_SKILLS` is derived from `CLAUDE_SKILL_WORKFLOW_IDS`, so adding `explore`/`reconcile` there automatically extended `checkSkillVersionDrift()`'s coverage; verified with a test

## 4. Docs
- [x] 4.1 Documented `/oprim:explore` and `/oprim:reconcile` in the root README's Agent commands table
- [x] 4.2 Scoping boundaries stated in the skill content itself: explore's template says it doesn't create bets (`oprim-bet`'s job); reconcile's template says it's distinct from `oprim doctor` (reports only, never writes fixes)
