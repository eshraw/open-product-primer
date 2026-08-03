## Requirements

### Requirement: oprim init SHALL scaffold oprim/scripts/ and generate-decisions-view.js
During `oprim init`, the system SHALL create `oprim/scripts/` (if not already present) and write `generate-decisions-view.js` into it. The script SHALL have no external dependencies — reading `oprim/decisions/` and rendering markdown is handled inline, mirroring `generate-sequence-view.js`.

#### Scenario: Init writes the script
- **WHEN** a user runs `oprim init`
- **THEN** `oprim/scripts/generate-decisions-view.js` is written with the inline-parser version of the script

#### Scenario: Script runs without external dependencies
- **WHEN** a user runs `node oprim/scripts/generate-decisions-view.js` from the project root
- **THEN** `oprim/decisions-view.md` is written
- **AND** no `npm install` or external package is required

### Requirement: oprim update SHALL refresh generate-decisions-view.js
During `oprim update`, the system SHALL overwrite `oprim/scripts/generate-decisions-view.js` with the current template version, keeping it in sync with CLI releases.

#### Scenario: Update refreshes the script
- **WHEN** a user runs `oprim update`
- **THEN** `oprim/scripts/generate-decisions-view.js` is overwritten with the current template
- **AND** no other oprim/ workspace files are affected

### Requirement: generate-decisions-view.js SHALL render a current-decisions rollup from oprim/decisions/
The script SHALL read every PDR file under `oprim/decisions/`, list PDRs with an Accepted status at the top level, and collapse any PDR marked superseded (`Status: … | Superseded by PDR-YYY`) into a linked reference under its successor rather than listing it as a standalone entry. This is a generated, read-only view — it SHALL NOT modify any PDR file or introduce a delta-merge truth model for decisions.

#### Scenario: Accepted PDRs listed at top level
- **GIVEN** `oprim/decisions/` contains PDR-001 (Accepted) and PDR-002 (Accepted)
- **WHEN** `generate-decisions-view.js` runs
- **THEN** `oprim/decisions-view.md` lists both PDR-001 and PDR-002 as current decisions

#### Scenario: Superseded PDRs collapsed under their successor
- **GIVEN** PDR-001 has `Status: Superseded by PDR-003`
- **WHEN** `generate-decisions-view.js` runs
- **THEN** PDR-001 does NOT appear as a standalone current decision
- **AND** PDR-003's entry includes a link back to PDR-001 as the decision it superseded

#### Scenario: Empty decisions directory produces an empty view
- **GIVEN** `oprim/decisions/` contains no PDR files
- **WHEN** `generate-decisions-view.js` runs
- **THEN** `oprim/decisions-view.md` is written with a message indicating no decisions exist yet, rather than an error

### Requirement: oprim-pdr SHALL regenerate oprim/decisions-view.md after creating a PDR
After writing a new or updated PDR file, the `oprim-pdr` skill (all agents) SHALL instruct the agent to run `node oprim/scripts/generate-decisions-view.js` from the project root, so the rollup view stays current without a manual step — the same pattern `/oprim:sequence` uses for `sequence-view.md`.

#### Scenario: PDR creation regenerates the view
- **WHEN** a user invokes the `oprim-pdr` skill and a new PDR file is written
- **THEN** after reporting the created PDR, the agent runs `node oprim/scripts/generate-decisions-view.js`
- **AND** `oprim/decisions-view.md` reflects the newly created PDR

#### Scenario: Codex/Gemini/Poolside agents have decisions-view regeneration parity
- **WHEN** a Codex, Gemini, or Poolside user invokes the oprim-pdr workflow
- **THEN** the inline workflow text includes the script-run step
- **AND** behavior matches the Claude/Cursor `oprim-pdr` skill
