## Requirements

### Requirement: Sequencing board interaction SHALL be driven by the oprim-sequence skill
The sequencing board interaction model changes from a command with inline steps to a skill-driven flow. The `oprim-sequence` skill owns all board reading, health computation, suggestion generation, move validation, and YAML execution. The `sequence.md` command SHALL be a thin wrapper that invokes the skill.

#### Scenario: Sequence command invokes skill
- **WHEN** the user runs `/oprim:sequence`
- **THEN** the `oprim-sequence` skill is invoked and drives the interaction

#### Scenario: Sequencing board stays unchanged from archival spec
- **WHEN** a bet is successfully archived using `oprim:archive`
- **THEN** `sequence.yaml` contains no entry for that bet ID in any bucket

### Requirement: sequence.yaml entries SHALL list the title field before the id field in each bet block
Each bet block in `sequence.yaml` (across `now`, `next`, `later`, and `backlog`) SHALL declare `title:` as the first field, followed by `id:`, so the human-readable title is scannable first when skimming the board.

#### Scenario: New bet block written with title first
- **WHEN** a bet block is written to `sequence.yaml` (e.g. via `oprim-bet` or `oprim:promote`)
- **THEN** `title:` appears before `id:` in that block

#### Scenario: Existing bet blocks reordered
- **WHEN** an existing `sequence.yaml` with `id:` before `title:` is next modified by oprim tooling
- **THEN** the modified block's fields are reordered to `title:` before `id:`
