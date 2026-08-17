## Context

`oprim init` / `oprim update` currently support five AI agents: Claude Code (`.claude/`), Cursor (`.cursor/`), Codex (`AGENTS.md`), Gemini CLI (`GEMINI.md`), and Poolside (`.poolside/` + `AGENTS.md`). Each has a detection heuristic and a corresponding install branch in `installAgentSkills()`.

Mistral Vibe (`mistralai/mistral-vibe`) uses:
- `.vibe/` directory as its project-level home (detection signal) — holding `agents/`, `prompts/`, and (per `docs.mistral.ai/vibe/code/cli/skills`) `skills/`
- `.vibe/skills/<name>/SKILL.md` for native skills, confirmed to follow the same Agent Skills spec (YAML frontmatter + Markdown body) that Claude/Cursor/Poolside already use — auto-discovered when the directory is "trusted," alongside `./.agents/skills/` and `~/.vibe/skills/`
- `AGENTS.md` for project-level instructions, walked up from cwd (loads up to two `AGENTS.md` files) — shared with Codex, Gemini, and Poolside

This confirms the bet's open question from `bet-decision.md`: `.vibe/` does support SKILL.md-compatible loading, so the dual-install path (skills + `AGENTS.md`) applies rather than the Codex/Gemini-style inline-only fallback.

## Goals / Non-Goals

**Goals:**
- Add `vibe` as a sixth `Agent` type with detection, prompt entry, and install logic
- Install oprim skills to `.vibe/skills/` (native) and an oprim section to `AGENTS.md` (dual install)
- Create `.vibe/` during install if absent (consistent with how `.claude/`, `.cursor/`, and `.poolside/` are created)

**Non-Goals:**
- PDR surfacing / `oprim:context` skill for Vibe (follow-up, not blocking — Poolside also deferred this)
- Hook installation for Vibe (no equivalent hook system exposed for project-level install)
- Registering `.vibe/` as a "trusted" directory — that's a Vibe-side user action outside oprim's install flow; oprim only needs to write the files in the expected location

## Decisions

### Dual install: skills + AGENTS.md

**Decision:** Always write both `.vibe/skills/` and an `AGENTS.md` section.

**Why:** Mistral's docs confirm Vibe auto-discovers project-level skills from `.vibe/skills/` (agentskills.io format) and separately loads `AGENTS.md` for project instructions. Writing both maximizes coverage the same way it does for Poolside — skill files give the native composable experience once the directory is trusted; the `AGENTS.md` section is a guaranteed fallback.

**Alternative considered:** AGENTS.md-only (treat Vibe like Codex/Gemini). Rejected once the docs confirmed skills support — underuses `.vibe/`'s skill-hosting capability, which was the whole reason this bet called out Vibe as different from Codex/Gemini.

### Always create `.vibe/` if absent

**Decision:** `installAgentSkills('vibe', ...)` creates `.vibe/` when it doesn't exist, logs the creation, then writes skills.

**Why:** Consistent with `.claude/`, `.cursor/`, and `.poolside/` handling. The user opted in to Vibe support by selecting it; creating the directory is the expected outcome.

### Detection via `.vibe/` directory

**Decision:** Detect Vibe by checking for `.vibe/` at project root.

**Why:** `.vibe/` is the canonical Vibe project directory and an unambiguous signal, mirroring how `.poolside/` is used rather than `AGENTS.md` (which Codex, Gemini, and Poolside also read — using it for detection would conflate multiple agents).

### Skill content mirrors `POOLSIDE_SKILLS`

**Decision:** `VIBE_SKILLS` uses the same six workflow ids as `POOLSIDE_SKILL_WORKFLOW_IDS` (pdr, bet, note, criteria, review, archive, sequence — via the shared `workflow-schema.ts`/`workflow-renderer.ts` rendering), adapted for Vibe invocation (`/skill-name` autocompletion, `.vibe/skills/` path).

**Why:** Vibe and Poolside share the same SKILL.md format and rendering pipeline (`renderSkillBody()`), so no new content authoring is needed beyond a `vibe` target in each workflow's schema.

## Risks / Trade-offs

- **`.vibe/` directory trust** → Vibe only auto-discovers project-level skills once the directory is "trusted" (a Vibe-side prompt/config, not something oprim controls). Skills will be written correctly but may not load until the user trusts the directory in Vibe. Documented as a known limitation, not a blocker — same category of risk as any agent-side opt-in step.
- **AGENTS.md collision with Codex/Poolside** → If a project has Codex, Poolside, and/or Vibe installed, `AGENTS.md` will contain multiple oprim sections. Each is idempotently managed within its own delimiters (`writeAgentInstructionFile()` already handles a single shared block), so re-runs stay safe; the overlap is cosmetic, same as the existing Poolside/Codex case.

## Migration Plan

Purely additive change. No existing behavior changes. No migration required.

`oprim update` re-runs `installAgentSkills()` for all configured agents, so Vibe users will receive updates automatically once this ships.

## Open Questions

None — the bet's original open question (whether `.vibe/` supports SKILL.md loading) was resolved during spec authoring by checking `docs.mistral.ai/vibe/code/cli/skills`.
