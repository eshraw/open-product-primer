## MODIFIED Requirements

### Requirement: oprim init SHALL scaffold oprim/scripts/ and generate-sequence-view.js
During `oprim init`, the system SHALL create `oprim/scripts/` and write `generate-sequence-view.js` into it. The script SHALL have no external dependencies — YAML parsing is handled inline.

#### Scenario: Init writes the script
- **WHEN** a user runs `oprim init`
- **THEN** `oprim/scripts/` directory exists
- **AND** `oprim/scripts/generate-sequence-view.js` is written with the inline-parser version of the script

#### Scenario: Script runs without external dependencies
- **WHEN** a user runs `node oprim/scripts/generate-sequence-view.js` from the project root
- **THEN** `oprim/sequence-view.md` is written with a Mermaid board diagram and backlog section
- **AND** no `npm install` or external package is required

### Requirement: oprim update SHALL refresh generate-sequence-view.js
During `oprim update`, the system SHALL overwrite `oprim/scripts/generate-sequence-view.js` with the current template version, keeping it in sync with CLI releases.

#### Scenario: Update refreshes the script
- **WHEN** a user runs `oprim update`
- **THEN** `oprim/scripts/generate-sequence-view.js` is overwritten with the current template
- **AND** no other oprim/ workspace files are affected

### Requirement: /oprim:sequence SHALL regenerate oprim/sequence-view.md after validation
After completing board validation, the `/oprim:sequence` skill (all agents) SHALL instruct the agent to run `node oprim/scripts/generate-sequence-view.js` from the project root to update the visual board file.

#### Scenario: Sequence skill regenerates the view
- **WHEN** a user invokes `/oprim:sequence` (or the equivalent workflow on Codex/Gemini)
- **THEN** after reporting validation results, the agent runs `node oprim/scripts/generate-sequence-view.js`
- **AND** `oprim/sequence-view.md` reflects the current state of `oprim/sequence.yaml`

#### Scenario: Codex/Gemini agents have sequence workflow parity
- **WHEN** a Codex or Gemini user invokes the oprim-sequence workflow
- **THEN** the inline workflow text includes both the 6 validation steps and the script-run step
- **AND** behaviour matches the Claude/Cursor `/oprim:sequence` skill
