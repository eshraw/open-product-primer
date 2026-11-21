## ADDED Requirements

### Requirement: Objectives SHALL be first-class artifacts under oprim/objectives/
An objective SHALL be a file `oprim/objectives/OBJ-NNN-<slug>.md` with a `# OBJ-NNN: <title>` heading and `## Status` (`Active` | `Achieved` | `Dropped` | `Superseded by OBJ-MMM`), `## Period` (e.g. `2027-Q1`), `## Key results` and `## Rationale` sections. With OKF frontmatter enabled it SHALL begin with a frontmatter block containing `type: objective`, `title`, `description`, `tags`, `timestamp`, `period` and `status`; with OKF disabled it SHALL have no frontmatter.

#### Scenario: Objective file with OKF on
- **GIVEN** a workspace with OKF frontmatter enabled
- **WHEN** an objective is created for "Grow repeat purchases" in 2027-Q1
- **THEN** `oprim/objectives/OBJ-001-grow-repeat-purchases.md` exists
- **AND** its frontmatter contains `type: objective`, `period: 2027-Q1` and `status: Active`

#### Scenario: Objective file with OKF off
- **GIVEN** a workspace with OKF frontmatter disabled
- **WHEN** an objective is created
- **THEN** the file starts with `# OBJ-001:` and has no frontmatter block

### Requirement: An oprim-objective workflow SHALL create objectives in portfolio workspaces
A bundled `objective` workflow (schema+template, `modes: [portfolio]`) SHALL assign the next `OBJ-NNN` ID from `oprim/objectives/`, gather title, period, key results and rationale, honour `rules.objective`, and support superseding an existing objective by updating its `## Status`.

#### Scenario: Next ID assignment
- **GIVEN** `oprim/objectives/` contains `OBJ-001-…` and `OBJ-004-…`
- **WHEN** the user runs the objective workflow
- **THEN** the new file is `OBJ-005-<slug>.md`

#### Scenario: Not installed in product mode
- **WHEN** `oprim update` runs in a product workspace
- **THEN** no objective skill or command is installed for any agent

### Requirement: Bets SHALL link objectives through an Objectives line in their Links section
A bet MAY list objectives as `- Objectives: <ref>, <ref>` in `## Links`, where each ref is an unqualified `OBJ-NNN` (current workspace) or a qualified `<source>:OBJ-NNN`. A `products:` entry's `objectives` field SHALL accept the same references. References SHALL resolve through the cross-product resolver.

#### Scenario: Product bet cites a portfolio objective
- **GIVEN** a product with portfolio source `acme-portfolio` that has `OBJ-002`
- **AND** a product bet with `- Objectives: acme-portfolio:OBJ-002`
- **WHEN** `oprim validate` runs in the product
- **THEN** the reference resolves and no failure is reported

#### Scenario: Dangling objective reference
- **GIVEN** a portfolio bet with `- Objectives: OBJ-009` and no `OBJ-009` exists
- **WHEN** `oprim validate` runs
- **THEN** it reports a required failure `objective: BET-NNN references OBJ-009, which does not exist`

### Requirement: Doctor and validate SHALL warn on bets with no objective only where a portfolio exists
A pending bet with no resolvable `- Objectives:` entry SHALL produce a non-required warning when the workspace is in portfolio mode, or when it is a product workspace with at least one registered source whose identity declares `mode: portfolio`. Product workspaces with no portfolio source SHALL get no such warning. A bet citing only objectives whose status is `Achieved`, `Dropped` or `Superseded` SHALL produce a non-required warning naming them.

#### Scenario: Product with no portfolio stays quiet
- **GIVEN** a product workspace with no portfolio source and a bet with no Objectives line
- **WHEN** `oprim doctor` runs
- **THEN** no objective warning is shown

#### Scenario: Portfolio bet without objective
- **GIVEN** a portfolio workspace and a pending bet with no Objectives line
- **WHEN** `oprim doctor` runs
- **THEN** it shows a non-required warning `objective: BET-NNN is not linked to any objective`

#### Scenario: Bet linked to a dropped objective
- **GIVEN** a bet linked only to `OBJ-003` whose status is `Dropped`
- **WHEN** `oprim doctor` runs
- **THEN** it shows a non-required warning that BET-NNN serves no active objective
