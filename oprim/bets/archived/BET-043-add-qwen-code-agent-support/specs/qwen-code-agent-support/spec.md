## ADDED Requirements

### Requirement: oprim SHALL detect a Qwen Code environment by checking for a .qwen/ directory
The system SHALL treat a `.qwen/` directory present at the project root as a Qwen Code environment indicator and SHALL return `'qwen'` from `detectAvailableAgents()` when that directory exists.

#### Scenario: .qwen/ directory present at project root
- **WHEN** a `.qwen/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'qwen'` in the returned list

#### Scenario: .qwen/ directory absent
- **WHEN** no `.qwen/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'qwen'` in the returned list

### Requirement: oprim SHALL install native skill files for Qwen Code under .qwen/skills/
When the user selects Qwen Code during `oprim init` or `oprim update`, the system SHALL write oprim skill files to `.qwen/skills/<name>/SKILL.md` for the same set of oprim workflows installed for Poolside and Mistral Vibe: pdr, bet, note, criteria, review, archive, sequence.

#### Scenario: Skills written to .qwen/skills/
- **WHEN** Qwen Code is selected and `.qwen/` exists
- **THEN** the command writes one `SKILL.md` file per oprim workflow under `.qwen/skills/`
- **AND** each file follows the Agent Skills (agentskills.io) SKILL.md format with YAML frontmatter and Markdown instructions, matching the format Qwen Code's own skill auto-discovery expects

#### Scenario: Install reports what was written
- **WHEN** Qwen Code installation completes
- **THEN** the command prints a confirmation line for each `.qwen/skills/<name>/SKILL.md` file written

### Requirement: oprim SHALL create the .qwen/ directory during install if it does not exist
When the user selects Qwen Code and `.qwen/` is absent, the system SHALL create the directory before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: .qwen/ created when absent
- **WHEN** Qwen Code is selected and `.qwen/` does not exist
- **THEN** the command creates `.qwen/`, writes the skill files under `.qwen/skills/`, and prints a notice that `.qwen/` was created

### Requirement: oprim SHALL install workflow instructions for Qwen Code by appending to AGENTS.md
When the user selects Qwen Code during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** Qwen Code is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for the oprim workflows

#### Scenario: First-time install with AGENTS.md present
- **WHEN** Qwen Code is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Qwen Code is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: AGENTS.md written even when .qwen/ already existed
- **WHEN** Qwen Code is selected and `.qwen/` already exists
- **THEN** the command still writes the AGENTS.md section (dual install always applies)
