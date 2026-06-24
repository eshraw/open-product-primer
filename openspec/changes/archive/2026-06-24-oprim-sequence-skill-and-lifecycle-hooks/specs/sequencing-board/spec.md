## MODIFIED Requirements

### Requirement: Sequencing board interaction SHALL be driven by the oprim-sequence skill
The sequencing board interaction model changes from a command with inline steps to a skill-driven flow. The `oprim-sequence` skill owns all board reading, health computation, suggestion generation, move validation, and YAML execution. The `sequence.md` command SHALL be a thin wrapper that invokes the skill.

#### Scenario: Sequence command invokes skill
- **WHEN** the user runs `/oprim:sequence`
- **THEN** the `oprim-sequence` skill is invoked and drives the interaction

#### Scenario: Sequencing board stays unchanged from archival spec
- **WHEN** a bet is successfully archived using `oprim:archive`
- **THEN** `sequence.yaml` contains no entry for that bet ID in any bucket
