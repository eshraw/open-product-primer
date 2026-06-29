## ADDED Requirements

### Requirement: oprim SHALL detect a Poolside environment by checking for a .poolside/ directory
The system SHALL treat a `.poolside/` directory present at the project root as a Poolside environment indicator and SHALL return `'poolside'` from `detectAvailableAgents()` when that directory exists.

#### Scenario: .poolside/ directory present at project root
- **WHEN** a `.poolside/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'poolside'` in the returned list

#### Scenario: .poolside/ directory absent
- **WHEN** no `.poolside/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'poolside'` in the returned list

### Requirement: oprim SHALL install native skill files for Poolside under .poolside/skills/
When the user selects Poolside during `oprim init` or `oprim update`, the system SHALL write oprim skill files to `.poolside/skills/<name>/SKILL.md` for all six oprim workflows: pdr, bet, criteria, review, archive, sequence.

#### Scenario: Skills written to .poolside/skills/
- **WHEN** Poolside is selected and `.poolside/` exists
- **THEN** the command writes six `SKILL.md` files under `.poolside/skills/`, one per oprim workflow
- **AND** each file follows the agentskills.io SKILL.md format with YAML frontmatter and Markdown instructions

#### Scenario: Install reports what was written
- **WHEN** Poolside installation completes
- **THEN** the command prints a confirmation line for each `.poolside/skills/<name>/SKILL.md` file written

### Requirement: oprim SHALL create the .poolside/ directory during install if it does not exist
When the user selects Poolside and `.poolside/` is absent, the system SHALL create the directory before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: .poolside/ created when absent
- **WHEN** Poolside is selected and `.poolside/` does not exist
- **THEN** the command creates `.poolside/`, writes the six skill files under `.poolside/skills/`, and prints a notice that `.poolside/` was created

### Requirement: oprim SHALL install workflow instructions for Poolside by appending to AGENTS.md
When the user selects Poolside during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** Poolside is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for all five oprim workflows: bet, criteria, pdr, review, archive

#### Scenario: First-time install with AGENTS.md present
- **WHEN** Poolside is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Poolside is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: AGENTS.md written even when .poolside/ already existed
- **WHEN** Poolside is selected and `.poolside/` already exists
- **THEN** the command still writes the AGENTS.md section (dual install always applies)
