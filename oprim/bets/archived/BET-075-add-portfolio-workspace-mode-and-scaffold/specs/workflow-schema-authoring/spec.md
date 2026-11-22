## ADDED Requirements

### Requirement: A workflow schema MAY declare the workspace modes it installs in
`<id>.schema.yaml` MAY carry `modes: [product, portfolio]` (any non-empty subset). An absent `modes` SHALL mean `[product, portfolio]` for every workflow except `spec-authoring`, which SHALL default to `[product]`. `oprim init` and `oprim update` SHALL install a workflow for an agent only when the workspace mode is in its `modes`. A project override in `oprim/workflows/` MAY change `modes`.

#### Scenario: Existing schemas keep installing in product mode
- **GIVEN** a bundled schema with no `modes` key
- **WHEN** `oprim update` runs in a product workspace
- **THEN** the workflow is installed exactly as before this change

#### Scenario: Portfolio-only workflow skipped in product mode
- **GIVEN** a bundled schema with `modes: [portfolio]`
- **WHEN** `oprim update` runs in a product workspace
- **THEN** no file for that workflow is written for any agent

#### Scenario: Invalid modes value
- **GIVEN** an override schema with `modes: [team]`
- **WHEN** `oprim update` runs
- **THEN** it fails with an error naming the override file and the invalid value

### Requirement: Installed workflow sets SHALL be derived from schemas, not hard-coded per agent
The per-agent workflow ID lists (Claude skills, Poolside-family skills, Cursor skills, Cursor commands, the inline section order) SHALL be computed from the bundled schemas' `order`, agent targets and `modes`. A workflow without `order` SHALL NOT be part of the standard install set. In product mode the computed lists SHALL contain the same workflows as today's hard-coded lists, and the inline block SHALL keep today's section order; a project override that omits `order` or `modes` SHALL inherit the bundled values.

#### Scenario: Product install parity
- **WHEN** `oprim update` runs in a product workspace with all agents selected
- **THEN** every installed file and the `<!-- oprim:start -->` inline block are byte-identical to the output before this change
