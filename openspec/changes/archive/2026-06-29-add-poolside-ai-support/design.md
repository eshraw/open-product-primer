## Context

`oprim init` / `oprim update` currently support four AI agents: Claude Code (`.claude/`), Cursor (`.cursor/`), Codex (`AGENTS.md`), and Gemini CLI (`GEMINI.md`). Each has a detection heuristic and a corresponding install branch in `installAgentSkills()`.

Poolside AI (`pool` CLI) uses:
- `.poolside/` directory as its project-level home (detection signal)
- `.poolside/skills/<name>/SKILL.md` for native skills (same agentskills.io format as Claude/Cursor)
- `AGENTS.md` for project-level instructions (shared with Codex)

## Goals / Non-Goals

**Goals:**
- Add `poolside` as a fifth `Agent` type with detection, prompt entry, and install logic
- Install oprim skills to `.poolside/skills/` (native) and an oprim section to `AGENTS.md` (dual install)
- Create `.poolside/` during install if absent (consistent with how `.claude/` and `.cursor/` are created)

**Non-Goals:**
- PDR surfacing / `oprim:context` skill for Poolside (follow-up, not blocking)
- Hook installation for Poolside (Poolside has no equivalent hook system)
- Diverging skill content from Cursor (content parity is sufficient at this stage)

## Decisions

### Dual install: skills + AGENTS.md

**Decision:** Always write both `.poolside/skills/` and an `AGENTS.md` section.

**Why:** Poolside's documentation confirms it reads both `.poolside/skills/` (for native skills) and `AGENTS.md` (for project instructions). Writing both maximises coverage — skill files give the native composable experience; the `AGENTS.md` section acts as a fallback and provides context even when skills aren't loaded.

**Alternative considered:** Skills-only. Rejected because AGENTS.md provides guaranteed instruction delivery regardless of how the user invokes Poolside.

### Always create `.poolside/` if absent

**Decision:** `installAgentSkills('poolside', ...)` creates `.poolside/` when it doesn't exist, logs the creation, then writes skills.

**Why:** Consistent with how `.claude/` and `.cursor/` are handled. The user has opted in to Poolside support; creating the directory is the expected outcome. Not creating it would silently skip skills and leave a confusing state.

**Alternative considered:** Skills-only-if-dir-exists fallback to AGENTS.md. Rejected as unnecessarily conditional — if the user selects Poolside, they want it set up.

### Detection via `.poolside/` directory

**Decision:** Detect Poolside by checking for `.poolside/` at project root.

**Why:** `.poolside/` is the canonical Poolside project directory and an unambiguous signal. Using `AGENTS.md` would conflate Poolside with Codex (both read it), causing both to be pre-checked when only one is present.

### Skill content mirrors `CURSOR_SKILLS`

**Decision:** `POOLSIDE_SKILLS` uses the same six playbooks as `CURSOR_SKILLS` (pdr, bet, criteria, review, archive, sequence), adapted for Poolside invocation (`/skills` command, `.poolside/skills/` path).

**Why:** Poolside and Cursor share the same SKILL.md format. The content is directly applicable. Extracting shared content into common constants is a valid future refactor but is out of scope here.

## Risks / Trade-offs

- **AGENTS.md collision with Codex** → If a project has both Codex and Poolside installed, `AGENTS.md` will contain two oprim sections (one from each). Each section is idempotently managed within its own delimiters, so re-runs are safe. The overlap is cosmetic and rare — accepted per product decision.

## Migration Plan

Purely additive change. No existing behaviour changes. No migration required.

`oprim update` re-runs `installAgentSkills()` for all configured agents, so Poolside users will receive updates automatically once this ships.

## Open Questions

None.
