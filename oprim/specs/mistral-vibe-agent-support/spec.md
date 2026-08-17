## Requirements

### Requirement: oprim SHALL detect a Mistral Vibe environment by checking for a .vibe/ directory
The system SHALL treat a `.vibe/` directory present at the project root as a Mistral Vibe environment indicator and SHALL return `'vibe'` from `detectAvailableAgents()` when that directory exists.

#### Scenario: .vibe/ directory present at project root
- **WHEN** a `.vibe/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'vibe'` in the returned list

#### Scenario: .vibe/ directory absent
- **WHEN** no `.vibe/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'vibe'` in the returned list

### Requirement: oprim SHALL install native skill files for Mistral Vibe under .vibe/skills/
When the user selects Mistral Vibe during `oprim init` or `oprim update`, the system SHALL write oprim skill files to `.vibe/skills/<name>/SKILL.md` for the same set of oprim workflows installed for Poolside: pdr, bet, note, criteria, review, archive, sequence.

#### Scenario: Skills written to .vibe/skills/
- **WHEN** Mistral Vibe is selected and `.vibe/` exists
- **THEN** the command writes one `SKILL.md` file per oprim workflow under `.vibe/skills/`
- **AND** each file follows the Agent Skills (agentskills.io) SKILL.md format with YAML frontmatter and Markdown instructions, matching the format Vibe's own skill auto-discovery expects

#### Scenario: Install reports what was written
- **WHEN** Mistral Vibe installation completes
- **THEN** the command prints a confirmation line for each `.vibe/skills/<name>/SKILL.md` file written

### Requirement: oprim SHALL create the .vibe/ directory during install if it does not exist
When the user selects Mistral Vibe and `.vibe/` is absent, the system SHALL create the directory before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: .vibe/ created when absent
- **WHEN** Mistral Vibe is selected and `.vibe/` does not exist
- **THEN** the command creates `.vibe/`, writes the skill files under `.vibe/skills/`, and prints a notice that `.vibe/` was created

### Requirement: oprim SHALL install workflow instructions for Mistral Vibe by appending to AGENTS.md
When the user selects Mistral Vibe during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** Mistral Vibe is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for the oprim workflows

#### Scenario: First-time install with AGENTS.md present
- **WHEN** Mistral Vibe is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Mistral Vibe is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: AGENTS.md written even when .vibe/ already existed
- **WHEN** Mistral Vibe is selected and `.vibe/` already exists
- **THEN** the command still writes the AGENTS.md section (dual install always applies)
