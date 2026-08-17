## ADDED Requirements

### Requirement: sequence.yaml entries SHALL list the title field before the id field in each bet block
Each bet block in `sequence.yaml` (across `now`, `next`, `later`, and `backlog`) SHALL declare `title:` as the first field, followed by `id:`, so the human-readable title is scannable first when skimming the board.

#### Scenario: New bet block written with title first
- **WHEN** a bet block is written to `sequence.yaml` (e.g. via `oprim-bet` or `oprim:promote`)
- **THEN** `title:` appears before `id:` in that block

#### Scenario: Existing bet blocks reordered
- **WHEN** an existing `sequence.yaml` with `id:` before `title:` is next modified by oprim tooling
- **THEN** the modified block's fields are reordered to `title:` before `id:`
