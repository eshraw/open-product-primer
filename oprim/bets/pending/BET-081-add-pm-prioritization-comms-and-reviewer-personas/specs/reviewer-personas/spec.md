## ADDED Requirements

### Requirement: Portfolio installs SHALL provide c-level, eng-lead and data-eng reviewer agents for Claude
When `claude` is a selected agent and the workspace is in portfolio mode, `oprim init` and `oprim update` SHALL write `.claude/agents/c-level.md`, `.claude/agents/eng-lead.md` and `.claude/agents/data-eng.md`. They SHALL NOT be written in product mode or for other agents. Persona bodies SHALL be bundled schema+template pairs (`persona-<name>`) and forkable via `oprim/workflows/`.

#### Scenario: Portfolio with Claude
- **WHEN** `oprim update` runs in a portfolio workspace with `claude` selected
- **THEN** the three agent files exist under `.claude/agents/`

#### Scenario: Product mode
- **WHEN** `oprim update` runs in a product workspace
- **THEN** no file under `.claude/agents/` is created by oprim

### Requirement: Each reviewer persona SHALL append a perspective section to the file it reviews
`c-level` SHALL review bet decisions, `eng-lead` SHALL review spec deltas and `design.md`, and `data-eng` SHALL review `criteria.yaml` (as a YAML comment block) or its bet's decision. Each SHALL append exactly one `## <persona> perspective` section (dated) and SHALL NOT edit existing content. Re-reviewing SHALL append a new dated section rather than replacing the previous one.

#### Scenario: c-level reviews a bet
- **GIVEN** a portfolio bet decision without a persona section
- **WHEN** the c-level agent reviews it
- **THEN** the file ends with `## c-level perspective` followed by a dated review
- **AND** all prior content is byte-identical

#### Scenario: data-eng reviews criteria.yaml
- **WHEN** the data-eng agent reviews `criteria.yaml`
- **THEN** the review is appended as `# ## data-eng perspective` comment lines and the YAML still parses to the same data
