## Requirements

### Requirement: Workflow content SHALL be defined as a declarative schema + template pair
Each oprim workflow artifact (bet, pdr, note, criteria, review, archive, context, sequence, spec-authoring, promote) SHALL be defined by a `<name>.schema.yaml` file (metadata: id, title, description, command name) and a corresponding `<name>.template.md` file (the workflow's instructional content, with `{{placeholder}}` tokens for per-agent substitution), bundled under `packages/cli/src/workflows/`.

#### Scenario: Bundled workflow definition exists for every current workflow
- **WHEN** the CLI package is built
- **THEN** `packages/cli/src/workflows/` contains a `<name>.schema.yaml` and `<name>.template.md` pair for each of: bet, pdr, note, criteria, review, archive, context, sequence, spec-authoring, promote

#### Scenario: Rendering an unmodified workflow produces unchanged output
- **WHEN** `oprim update` renders a workflow that has no project-level override
- **THEN** the generated file content is byte-identical to the content produced by the pre-refactor string-literal function for that workflow

### Requirement: A project SHALL be able to override a single workflow definition without editing CLI source
The system SHALL allow a project to place `oprim/workflows/<name>.schema.yaml` and/or `oprim/workflows/<name>.template.md` in its own repository tree. When present, the project-local file SHALL take precedence over the CLI-bundled file of the same name during rendering, matched independently per file (a project may override only the template while keeping the bundled schema, or vice versa).

#### Scenario: Project overrides a workflow template
- **WHEN** `oprim/workflows/bet.template.md` exists in the project and `oprim update` runs
- **THEN** the rendered `bet` workflow output for every agent uses the project's `bet.template.md` content instead of the CLI-bundled one

#### Scenario: Project overrides only the schema, not the template
- **WHEN** `oprim/workflows/bet.schema.yaml` exists in the project but `oprim/workflows/bet.template.md` does not
- **THEN** the renderer uses the project's schema metadata combined with the CLI-bundled `bet.template.md`

#### Scenario: No project override present
- **WHEN** `oprim/workflows/` does not exist, or contains no file matching a given workflow name
- **THEN** the renderer uses the CLI-bundled schema and template for that workflow with no behavior change

### Requirement: An invalid workflow override SHALL fail with an actionable error, not silently fall back
If a project-level `oprim/workflows/<name>.schema.yaml` or `<name>.template.md` exists but fails to parse (invalid YAML, missing required schema fields), `oprim update`/`oprim init` SHALL fail that workflow's render step with an error naming the file and the parse problem, rather than silently using the CLI-bundled default.

#### Scenario: Malformed override schema
- **WHEN** `oprim/workflows/bet.schema.yaml` exists but is not valid YAML
- **THEN** `oprim update` reports an error identifying `oprim/workflows/bet.schema.yaml` and does not silently substitute the bundled default

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
