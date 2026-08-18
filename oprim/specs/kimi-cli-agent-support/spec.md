## Requirements

### Requirement: oprim SHALL detect a Kimi CLI environment by checking for a .kimi/ directory
The system SHALL treat a `.kimi/` directory present at the project root as a Kimi CLI environment indicator and SHALL return `'kimi'` from `detectAvailableAgents()` when that directory exists.

#### Scenario: .kimi/ directory present at project root
- **WHEN** a `.kimi/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'kimi'` in the returned list

#### Scenario: .kimi/ directory absent
- **WHEN** no `.kimi/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'kimi'` in the returned list

### Requirement: oprim SHALL install native skill files for Kimi CLI under .skills/, not .kimi/skills/
When the user selects Kimi CLI during `oprim init` or `oprim update`, the system SHALL write oprim skill files to `.skills/<name>/SKILL.md` at the project root — not `.kimi/skills/` — for the same set of oprim workflows installed for Poolside, Mistral Vibe, and Qwen Code: pdr, bet, note, criteria, review, archive, sequence. This deviates from the `.<agent>/skills/` pattern used by other dual-install agents because it matches Kimi CLI's actual skill-discovery convention.

#### Scenario: Skills written to .skills/, not .kimi/skills/
- **WHEN** Kimi CLI is selected and `.kimi/` exists
- **THEN** the command writes one `SKILL.md` file per oprim workflow under `.skills/`
- **AND** no skill files are written under `.kimi/skills/`
- **AND** each file follows the Agent Skills (agentskills.io) SKILL.md format with YAML frontmatter and Markdown instructions

#### Scenario: Install reports what was written
- **WHEN** Kimi CLI installation completes
- **THEN** the command prints a confirmation line for each `.skills/<name>/SKILL.md` file written

### Requirement: oprim SHALL create the .kimi/ and .skills/ directories during install if they do not exist
When the user selects Kimi CLI, the system SHALL create `.kimi/` if absent (for detection) and independently create `.skills/` if absent (for skill files) before writing, and SHALL emit a notice for each directory created.

#### Scenario: .kimi/ created when absent
- **WHEN** Kimi CLI is selected and `.kimi/` does not exist
- **THEN** the command creates `.kimi/` and prints a notice that `.kimi/` was created

#### Scenario: .skills/ created when absent
- **WHEN** Kimi CLI is selected and `.skills/` does not exist
- **THEN** the command creates `.skills/`, writes the skill files under it, and prints a notice that `.skills/` was created

### Requirement: oprim SHALL install workflow instructions for Kimi CLI by appending to AGENTS.md
When the user selects Kimi CLI during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** Kimi CLI is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for the oprim workflows

#### Scenario: First-time install with AGENTS.md present
- **WHEN** Kimi CLI is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Kimi CLI is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: AGENTS.md written even when .kimi/ already existed
- **WHEN** Kimi CLI is selected and `.kimi/` already exists
- **THEN** the command still writes the AGENTS.md section (dual install always applies)
