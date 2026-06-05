## ADDED Requirements

### Requirement: oprim SHALL detect a Codex environment by checking for AGENTS.md
The system SHALL treat `AGENTS.md` present at the project root as a Codex environment indicator and SHALL return `'codex'` from `detectAvailableAgents()` when that file exists.

#### Scenario: AGENTS.md present at project root
- **WHEN** `AGENTS.md` exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'codex'` in the returned list

#### Scenario: AGENTS.md absent
- **WHEN** no `AGENTS.md` file exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'codex'` in the returned list

### Requirement: oprim SHALL install workflow instructions for Codex by appending to AGENTS.md
When the user selects Codex during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** Codex is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for all five oprim workflows: bet, criteria, pdr, review, archive

#### Scenario: First-time install with AGENTS.md present
- **WHEN** Codex is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Codex is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: Install reports what was written
- **WHEN** Codex installation completes
- **THEN** the command prints a confirmation line identifying `AGENTS.md` as the file that was written

### Requirement: Codex installation SHALL inline all five oprim workflow instructions
The oprim section written to `AGENTS.md` SHALL contain self-contained prose instructions for all five oprim workflows: bet authoring, criteria authoring, PDR authoring, KPI review, and bet archiving. Instructions SHALL be sufficient to execute each workflow without invoking an external skill file.

#### Scenario: Bet authoring instructions present
- **WHEN** oprim is installed for Codex
- **THEN** `AGENTS.md` contains instructions for creating a bet in `oprim/bets/` including ID assignment, title validation, and sequence.yaml registration

#### Scenario: All five workflows documented
- **WHEN** oprim is installed for Codex
- **THEN** `AGENTS.md` contains sections for bet, criteria, pdr, review, and archive workflows
