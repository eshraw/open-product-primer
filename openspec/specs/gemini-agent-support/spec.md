## ADDED Requirements

### Requirement: oprim SHALL detect a Gemini CLI environment by checking for GEMINI.md
The system SHALL treat `GEMINI.md` present at the project root as a Gemini CLI environment indicator and SHALL return `'gemini'` from `detectAvailableAgents()` when that file exists.

#### Scenario: GEMINI.md present at project root
- **WHEN** `GEMINI.md` exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'gemini'` in the returned list

#### Scenario: GEMINI.md absent
- **WHEN** no `GEMINI.md` file exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'gemini'` in the returned list

### Requirement: oprim SHALL install workflow instructions for Gemini CLI by appending to GEMINI.md
When the user selects Gemini CLI during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `GEMINI.md`, creating the file if it does not exist. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with GEMINI.md absent
- **WHEN** Gemini CLI is selected and `GEMINI.md` does not exist
- **THEN** the command creates `GEMINI.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for all five oprim workflows: bet, criteria, pdr, review, archive

#### Scenario: First-time install with GEMINI.md present
- **WHEN** Gemini CLI is selected and `GEMINI.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** Gemini CLI is selected and `GEMINI.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: Install reports what was written
- **WHEN** Gemini CLI installation completes
- **THEN** the command prints a confirmation line identifying `GEMINI.md` as the file that was written

### Requirement: Gemini CLI installation SHALL inline all five oprim workflow instructions
The oprim section written to `GEMINI.md` SHALL contain self-contained prose instructions for all five oprim workflows: bet authoring, criteria authoring, PDR authoring, KPI review, and bet archiving. Instructions SHALL be sufficient to execute each workflow without invoking an external skill file.

#### Scenario: Bet authoring instructions present
- **WHEN** oprim is installed for Gemini CLI
- **THEN** `GEMINI.md` contains instructions for creating a bet in `oprim/bets/` including ID assignment, title validation, and sequence.yaml registration

#### Scenario: All five workflows documented
- **WHEN** oprim is installed for Gemini CLI
- **THEN** `GEMINI.md` contains sections for bet, criteria, pdr, review, and archive workflows
