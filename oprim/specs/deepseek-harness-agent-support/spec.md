## Requirements

### Requirement: oprim SHALL detect a DeepSeek Harness environment by checking for a .dsh/ directory
The system SHALL treat a `.dsh/` directory present at the project root as a DeepSeek Harness (dsh) environment indicator and SHALL return `'dsh'` from `detectAvailableAgents()` when that directory exists.

#### Scenario: .dsh/ directory present at project root
- **WHEN** a `.dsh/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` includes `'dsh'` in the returned list

#### Scenario: .dsh/ directory absent
- **WHEN** no `.dsh/` directory exists at the repository root
- **THEN** `detectAvailableAgents()` does not include `'dsh'` in the returned list

### Requirement: oprim SHALL install native skill files for DeepSeek Harness under .dsh/skills/
When the user selects DeepSeek Harness during `oprim init` or `oprim update`, the system SHALL write oprim skill files to `.dsh/skills/<name>/SKILL.md` for the same set of oprim workflows installed for Poolside, Mistral Vibe, and Qwen Code: pdr, bet, note, criteria, review, archive, sequence.

#### Scenario: Skills written to .dsh/skills/
- **WHEN** DeepSeek Harness is selected and `.dsh/` exists
- **THEN** the command writes one `SKILL.md` file per oprim workflow under `.dsh/skills/`
- **AND** each file follows dsh's documented skill-discovery convention (`.dsh/skills/<name>/SKILL.md`, resolved from the nearest `.git` root), matching the existing Agent Skills SKILL.md format oprim already writes for other agents

#### Scenario: Install reports what was written
- **WHEN** DeepSeek Harness installation completes
- **THEN** the command prints a confirmation line for each `.dsh/skills/<name>/SKILL.md` file written

### Requirement: oprim SHALL create the .dsh/ directory during install if it does not exist
When the user selects DeepSeek Harness and `.dsh/` is absent, the system SHALL create the directory before writing skill files and SHALL emit a notice that the directory was created.

#### Scenario: .dsh/ created when absent
- **WHEN** DeepSeek Harness is selected and `.dsh/` does not exist
- **THEN** the command creates `.dsh/`, writes the skill files under `.dsh/skills/`, and prints a notice that `.dsh/` was created

### Requirement: oprim SHALL install workflow instructions for DeepSeek Harness by appending to AGENTS.md
When the user selects DeepSeek Harness during `oprim init` or `oprim update`, the system SHALL append an oprim workflow section to `AGENTS.md`, creating the file if it does not exist, using the same shared delimiter block Codex, Poolside, Mistral Vibe, and Qwen Code use. The section SHALL be delimited by `<!-- oprim:start -->` and `<!-- oprim:end -->` HTML comment markers to enable idempotent re-runs.

#### Scenario: First-time install with AGENTS.md absent
- **WHEN** DeepSeek Harness is selected and `AGENTS.md` does not exist
- **THEN** the command creates `AGENTS.md` with the oprim section wrapped in delimiter comments
- **AND** the section contains inline instructions for the oprim workflows

#### Scenario: First-time install with AGENTS.md present
- **WHEN** DeepSeek Harness is selected and `AGENTS.md` already exists with user content
- **THEN** the command appends the oprim section after the existing content without modifying any pre-existing text
- **AND** the section is wrapped in `<!-- oprim:start -->` and `<!-- oprim:end -->` delimiters

#### Scenario: Re-run replaces existing oprim section
- **WHEN** DeepSeek Harness is selected and `AGENTS.md` already contains an `<!-- oprim:start -->` ... `<!-- oprim:end -->` block
- **THEN** the command replaces the content between the delimiters with the current version of the oprim instructions
- **AND** all content outside the oprim delimiters is preserved unchanged

#### Scenario: AGENTS.md written even when .dsh/ already existed
- **WHEN** DeepSeek Harness is selected and `.dsh/` already exists
- **THEN** the command still writes the AGENTS.md section (dual install always applies)

### Requirement: DeepSeek Harness SHALL appear in the supported-agent list with test coverage parity
The system SHALL document DeepSeek Harness (`dsh`) alongside the other seven supported agents in the README and SHALL have `detect.ts`/`install-agent.ts` test coverage for `dsh` equivalent to the coverage that exists for Kimi, Mistral Vibe, and Qwen Code.

#### Scenario: dsh listed in README supported-agent table
- **WHEN** a reader consults the README's supported-agent list
- **THEN** DeepSeek Harness (`dsh`) is listed alongside Claude, Cursor, Codex, Gemini, Poolside, Mistral Vibe, and Qwen Code

#### Scenario: dsh detection and install covered by tests
- **WHEN** the test suite runs
- **THEN** tests exist covering `.dsh/` detection in `detect.ts` and skill/AGENTS.md installation in `install-agent.ts`, matching the pattern used for the other agents' test coverage
