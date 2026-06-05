## Context

`packages/cli/src/lib/detect.ts` and `install-agent.ts` are the two modules that together govern which AI tools oprim knows about and how it installs skills into them. Today `Agent = 'claude' | 'cursor'`. Both Codex (OpenAI) and Gemini CLI (Google) are production agentic tools with their own project-level instruction files (`AGENTS.md` and `GEMINI.md` respectively); neither has a Skill tool equivalent.

## Goals / Non-Goals

**Goals:**
- Detect Codex and Gemini CLI by checking for their canonical instruction files at the project root
- Install all five oprim workflows (bet, criteria, pdr, review, archive) for each new agent as inlined prose — no delegation to a Skill tool
- Surface Codex and Gemini CLI in the `oprim init` / `oprim update` agent selection prompts
- Accept `--agent codex` and `--agent gemini` flags on init

**Non-Goals:**
- Writing individual tool definition files under `.codex/` or `.gemini/skills/` (follow-on, not this change)
- Supporting any agent beyond Codex and Gemini CLI in this change
- Changing the Claude Code or Cursor installation paths
- Changing the oprim data model or YAML schemas

## Decisions

### Decision: Detect by instruction file presence, not by directory

Codex presence = `AGENTS.md` exists at project root. Gemini CLI presence = `GEMINI.md` exists at project root.

*Alternative: detect by `.codex/` or `.gemini/` directory.* Rejected — users may not have created these directories yet even when actively using the tool; `AGENTS.md` and `GEMINI.md` are written on first meaningful use and are the most reliable indicators.

### Decision: Install as appended section in the tool's instruction file

For Codex: append an `## oprim` section to `AGENTS.md` (create the file if absent). For Gemini CLI: append an `## oprim` section to `GEMINI.md` (create the file if absent). All five oprim workflows are inlined as prose in that section — no separate file per workflow.

*Alternative: write individual skill files under `.codex/` or `.gemini/skills/`.* Not done in this change — neither tool currently has a standardized skill-file discovery mechanism comparable to `.claude/skills/`. Prose installation is the lowest-common-denominator that works reliably today.

### Decision: Inline all workflow content (Cursor-style), not skill delegation (Claude-style)

Codex and Gemini CLI lack a `Skill` tool call mechanism. Content mirrors the Cursor inline command approach: a single block per workflow with enough context to execute without delegation.

*Alternative: try to map to each tool's native plugin/function mechanism.* Deferred — the goal of this bet is baseline parity in 4 weeks, not native integration.

### Decision: Re-run is idempotent via section replacement

On a second `oprim update`, the installer reads the instruction file, removes any existing `## oprim` section (delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comments), then appends the fresh version. This prevents duplicate sections without requiring the user to manually edit the file.

## Risks / Trade-offs

- [Risk] `AGENTS.md` is a common filename that non-Codex projects may use → The false-positive detection risk is low in practice; the installer only appends an `## oprim` block and does not overwrite existing content. Users can decline in the interactive prompt.
- [Risk] `GEMINI.md` may be renamed or deprecated by Google → Mitigation: the detection and installation paths are isolated to one function each; updating is a one-line change.
- [Risk] Inlined prose grows large as more workflows are added → Mitigation: this is already the Cursor pattern; acceptable for the near term. Native skill-file support is the long-term path.

## Migration Plan

No migration required. This change is purely additive:
- Existing `agents: [claude]` and `agents: [claude, cursor]` configs remain valid and unchanged
- No existing files are modified unless the user explicitly selects Codex or Gemini CLI during `oprim init` or `oprim update`
- Rollback: revert the `install-agent.ts` and `detect.ts` changes; no data artifacts are affected
