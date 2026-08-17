## Context

`oprim init` / `oprim update` currently support six AI agents (seven once BET-043/Qwen Code lands): Claude Code (`.claude/`), Cursor (`.cursor/`), Codex (`AGENTS.md`), Gemini CLI (`GEMINI.md`), Poolside (`.poolside/` + `AGENTS.md`), and Mistral Vibe (`.vibe/` + `AGENTS.md`). Each has a detection heuristic and a corresponding install branch in `installAgentSkills()`.

Kimi CLI (`MoonshotAI/kimi-cli`) is the first agent in this set with a **split** detection/install path:
- `.kimi/` directory as the detection signal (project-level home)
- Skills load from a project's **`.skills/`** directory, not `.kimi/skills/` — a genuine deviation from the `.<agent>/skills/` pattern every other dual-install agent (Poolside, Vibe, and Qwen Code) follows
- `AGENTS.md` for project-level instructions — the upstream `kimi-cli` repo ships its own `AGENTS.md`, which is evidence (not confirmed via official docs) that Kimi CLI reads it

## Goals / Non-Goals

**Goals:**
- Add `kimi` as a new `Agent` type, detected via `.kimi/`
- Install oprim skills to `.skills/` (not `.kimi/skills/` — per Kimi's actual discovery convention) and an oprim section to `AGENTS.md` (dual install)
- Create `.kimi/` during install if absent, for detection consistency — `.skills/` is created as needed independently since it is not `.kimi/`-scoped

**Non-Goals:**
- PDR surfacing / `oprim:context` skill for Kimi (follow-up, not blocking — every prior agent-support bet deferred this too)
- Hook installation for Kimi (no equivalent hook system exposed for project-level install)
- Renaming or aliasing `.skills/` to avoid collision with other tools — out of scope; flagged as a risk below instead

## Decisions

### Split path: detect via `.kimi/`, install skills to `.skills/`

**Decision:** `detectAvailableAgents()` checks for `.kimi/`; `installAgentSkills('kimi', ...)` writes skill files under `.skills/<name>/SKILL.md`, not `.kimi/skills/`.

**Why:** Per the bet-decision's own risk profile, Kimi CLI's real skill-discovery path is `.skills/` at the project root — a `.kimi/skills/` path would silently fail to load. `.kimi/` remains the correct detection signal since it's the CLI's own project-level directory.

**Alternative considered:** Install into `.kimi/skills/` for path-naming consistency with the `.<agent>/` pattern. Rejected (already rejected in the bet-decision itself) because skills placed there would not be discovered by Kimi CLI.

### Dual install: `.skills/` + AGENTS.md

**Decision:** Always write both `.skills/` and an `AGENTS.md` section.

**Why:** Confirmed during promote (via clarifying question): the bet-decision cites the upstream `kimi-cli` repo shipping its own `AGENTS.md` as evidence Kimi reads project-level `AGENTS.md`. Mirrors the Poolside/Vibe fallback pattern — cheap to add given `writeAgentInstructionFile()` is already shared.

**Alternative considered:** `.skills/`-only, deferring `AGENTS.md` until confirmed. Rejected — the fallback costs nothing extra to implement and the upstream evidence, while not a docs citation, is a reasonably strong signal.

### Always create `.kimi/` if absent, `.skills/` created independently

**Decision:** `installAgentSkills('kimi', ...)` creates `.kimi/` when absent (for detection consistency, matching every other agent's directory-creation behavior) and separately ensures `.skills/` exists before writing skill files into it.

**Why:** `.kimi/` is the canonical detection directory even though it holds no skill content for Kimi; `.skills/` is a project-root-level directory, not nested under `.kimi/`, so it needs its own existence check independent of `.kimi/`'s.

### Skill content mirrors `POOLSIDE_SKILLS`

**Decision:** `KIMI_SKILLS` uses the same seven workflow ids as `POOLSIDE_SKILL_WORKFLOW_IDS` (pdr, bet, note, criteria, review, archive, sequence), adapted for Kimi's `.skills/` path.

**Why:** Kimi CLI's skills are documented as SKILL.md-compatible, so no new content authoring is needed beyond a `kimi` target in each workflow's schema (defaulting to mirror `poolside.skill`, same pattern as `vibe`/`qwen`).

## Risks / Trade-offs

- **`.skills/` collision** → `.skills/` is a shared, project-root-level convention rather than `.kimi/`-namespaced. If another installed tool in the same repo also reads `.skills/`, oprim's Kimi skill files could collide with or be misread by that tool. This is the bet's own stated kill criterion — flagged here as a known trade-off, not resolved by this design (no other currently-supported oprim agent uses `.skills/`, so no collision exists today).
- **`AGENTS.md` support unconfirmed** → same caveat as Qwen Code: no official docs citation, only upstream repo evidence.

## Migration Plan

Purely additive change. No existing behavior changes. No migration required.

`oprim update` re-runs `installAgentSkills()` for all configured agents, so Kimi CLI users will receive updates automatically once this ships.

## Open Questions

None — the dual-install question was resolved during promote. The `.skills/` collision risk (bet's kill criterion) remains an open risk to monitor post-ship, not a blocking question.
