## Context

`oprim init` / `oprim update` currently support six AI agents: Claude Code (`.claude/`), Cursor (`.cursor/`), Codex (`AGENTS.md`), Gemini CLI (`GEMINI.md`), Poolside (`.poolside/` + `AGENTS.md`), and Mistral Vibe (`.vibe/` + `AGENTS.md`). Each has a detection heuristic and a corresponding install branch in `installAgentSkills()`.

Qwen Code (`QwenLM/qwen-code`) uses:
- `.qwen/` directory as its project-level home (detection signal)
- `.qwen/skills/<name>/SKILL.md` for native skills — the same Agent Skills spec (YAML frontmatter + Markdown body) that Claude/Cursor/Poolside/Vibe already use, auto-discovered and auto-refreshed per current docs
- `AGENTS.md` for project-level instructions — Qwen Code's own docs don't call this out explicitly, but the bet's own risk profile calls this the lowest-lift of the four pending agent-support bets specifically because it's a straight mirror of the Poolside pattern

## Goals / Non-Goals

**Goals:**
- Add `qwen` as a seventh `Agent` type with detection, prompt entry, and install logic
- Install oprim skills to `.qwen/skills/` (native) and an oprim section to `AGENTS.md` (dual install)
- Create `.qwen/` during install if absent (consistent with `.claude/`, `.cursor/`, `.poolside/`, `.vibe/`)

**Non-Goals:**
- PDR surfacing / `oprim:context` skill for Qwen (follow-up, not blocking — Poolside and Vibe also deferred this)
- Hook installation for Qwen (no equivalent hook system exposed for project-level install)

## Decisions

### Dual install: skills + AGENTS.md

**Decision:** Always write both `.qwen/skills/` and an `AGENTS.md` section.

**Why:** Confirmed during promote (via clarifying question, since the bet-decision's Expected outcomes only mention `.qwen/skills/`): dual install mirrors the Poolside/Vibe fallback pattern — skill files give the native composable experience once auto-discovery picks them up; the `AGENTS.md` section is a guaranteed fallback if Qwen's skill discovery isn't enabled in a given project.

**Alternative considered:** Skills-only (treat Qwen like Claude/Cursor). Rejected as the safer default given no independent confirmation of Qwen's `AGENTS.md` support either way — matching the fallback pattern costs nothing extra to implement since `writeAgentInstructionFile()` is already shared.

### Always create `.qwen/` if absent

**Decision:** `installAgentSkills('qwen', ...)` creates `.qwen/` when it doesn't exist, logs the creation, then writes skills.

**Why:** Consistent with `.claude/`, `.cursor/`, `.poolside/`, and `.vibe/` handling.

### Detection via `.qwen/` directory

**Decision:** Detect Qwen Code by checking for `.qwen/` at project root.

**Why:** `.qwen/` is the canonical Qwen Code project directory and an unambiguous signal, mirroring `.poolside/`/`.vibe/` rather than `AGENTS.md` (shared by multiple agents, so unusable for detection).

### Skill content mirrors `POOLSIDE_SKILLS`

**Decision:** `QWEN_SKILLS` uses the same seven workflow ids as `POOLSIDE_SKILL_WORKFLOW_IDS` (pdr, bet, note, criteria, review, archive, sequence — via the shared `workflow-schema.ts`/`workflow-renderer.ts` rendering), adapted for Qwen invocation (`.qwen/skills/` path).

**Why:** Qwen Code and Poolside/Vibe share the same SKILL.md format and rendering pipeline (`renderSkillBody()`), so no new content authoring is needed beyond a `qwen` target in each workflow's schema (defaulting to mirror `poolside.skill`, same as `vibe`'s default).

## Risks / Trade-offs

- **`AGENTS.md` support unconfirmed** → Qwen Code's docs weren't independently verified to load `AGENTS.md` as project instructions. Writing the section is low-cost and harmless if unused; documented as an assumption, not a confirmed fact, unlike Vibe's case where docs were checked directly.
- **AGENTS.md collision with Codex/Poolside/Vibe** → If a project has multiple dual-install agents configured, `AGENTS.md` will contain multiple oprim sections. Each is idempotently managed within its own delimiters, so re-runs stay safe.

## Migration Plan

Purely additive change. No existing behavior changes. No migration required.

`oprim update` re-runs `installAgentSkills()` for all configured agents, so Qwen Code users will receive updates automatically once this ships.

## Open Questions

None — the dual-install question was resolved during promote.
