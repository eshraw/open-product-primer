## Requirements

### Requirement: demo-project SHALL provide an in-repo pre-scaffolded example workspace around a mock product
The repository SHALL include an `examples/` directory containing a pre-scaffolded `oprim/` workspace, scoped to a small mock product (a todo app) rather than left empty, so the tutorial has concrete, relatable content to walk through. The user SHALL be able to clone and use it immediately, with no `oprim init` step required.

#### Scenario: Clone and go
- **GIVEN** a fresh clone of the repository
- **WHEN** the user opens the `examples/` directory
- **THEN** a working `oprim/` workspace is already present, requiring no initialization step

#### Scenario: Mock product gives the tutorial concrete content
- **GIVEN** the pre-scaffolded example workspace
- **WHEN** the user inspects its bets, PDRs, or specs
- **THEN** they reference a small, relatable mock product (a todo app), not placeholder or empty content

### Requirement: demo-project SHALL include a guided tutorial for the bet-to-archive cycle
The example project SHALL include a guided tutorial command or skill that walks the user through one full bet → spec → archive workflow cycle, step by step.

#### Scenario: Guided cycle
- **WHEN** the user invokes the tutorial command inside `examples/`
- **THEN** it walks them through creating a bet, generating a spec delta, and archiving it, in order
