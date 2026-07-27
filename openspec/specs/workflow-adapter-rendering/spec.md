## ADDED Requirements

### Requirement: The CLI SHALL render per-agent output from a workflow schema+template pair
Given a resolved workflow schema+template pair (see `workflow-schema-authoring`), the system SHALL render the appropriate output for each supported agent from that single source: a Claude `SKILL.md` plus command wrapper, a Cursor inline command file, and a Codex/Gemini/Poolside inline instruction block suitable for insertion between `<!-- oprim:start -->`/`<!-- oprim:end -->` markers.

#### Scenario: Render for Claude
- **WHEN** `oprim update` runs for a project with `.claude/` present
- **THEN** the renderer produces a `SKILL.md` and command wrapper for each workflow, equivalent in structure to the pre-refactor `claudeWrapper()` output

#### Scenario: Render for Cursor
- **WHEN** `oprim update` runs for a project with `.cursor/` present
- **THEN** the renderer produces an inline Cursor command file for each workflow, equivalent in structure to the pre-refactor `cursorWrapper()` output

#### Scenario: Render for Codex/Gemini/Poolside
- **WHEN** `oprim update` runs for a project with `AGENTS.md`, `GEMINI.md`, or `.poolside/` present
- **THEN** the renderer produces the same inline instruction block content as the pre-refactor `*InlineContent()` functions, written between the existing `<!-- oprim:start -->`/`<!-- oprim:end -->` delimiters

### Requirement: Rendering SHALL preserve existing cross-cutting behaviors
The renderer SHALL preserve behaviors that are orchestrated outside individual workflow content: optional PDR-surfacing Step 0 injection into the `bet` workflow's Claude skill, and hook registration in `.claude/settings.json`.

#### Scenario: PDR-surfacing Step 0 still applies after migration
- **WHEN** PDR-surfacing is enabled for a project and `oprim update` renders the `bet` workflow for Claude
- **THEN** the rendered `SKILL.md` includes the same Step 0 PDR-surfacing block that the pre-refactor `addContextStepToFile()` step produced

#### Scenario: oprim doctor skill-drift check is unaffected
- **WHEN** `oprim doctor` runs after this refactor ships
- **THEN** the skill-drift comparison in `doctor-skill-version` continues to compare installed skill files against "the content the current CLI would write," now sourced from the renderer, with no change to the doctor requirement text or user-visible warning format
