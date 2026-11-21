## ADDED Requirements

### Requirement: oprim/config.yaml SHALL support a mode key whose absence means product
`mode` accepts `product` or `portfolio`. A config with no `mode` key SHALL behave exactly as `mode: product`. Any other value SHALL be reported by `oprim doctor` and `oprim validate` as a required failure naming the value.

#### Scenario: Existing config without mode
- **GIVEN** an `oprim/config.yaml` created before this change, with no `mode` key
- **WHEN** any oprim command reads the workspace mode
- **THEN** the mode resolves to `product`
- **AND** no command adds a `mode` key to that file

#### Scenario: Invalid mode value
- **GIVEN** `mode: portfoilo` in `oprim/config.yaml`
- **WHEN** `oprim validate` runs
- **THEN** it reports a required failure `config: unknown mode "portfoilo" (expected product | portfolio)` and exits non-zero

### Requirement: oprim init SHALL scaffold a portfolio workspace when run with --mode portfolio
`oprim init --mode portfolio` SHALL create everything product-mode init creates, plus `oprim/company/{overview,principles,glossary}.md`, `oprim/objectives/`, `STATE.md`, `inbox.md`, `wiki/` (with `wiki/people/`, `wiki/products/`, `wiki/decisions/`, `wiki/log.md`) and `outputs/`, and SHALL write `mode: portfolio` to `oprim/config.yaml`. Init SHALL NOT overwrite any of these files when they already exist.

#### Scenario: Fresh portfolio init
- **GIVEN** an empty directory
- **WHEN** the user runs `oprim init --mode portfolio`
- **THEN** all product-mode scaffold files exist
- **AND** `oprim/company/overview.md`, `oprim/company/principles.md`, `oprim/company/glossary.md`, `STATE.md`, `inbox.md`, `wiki/log.md` and the `oprim/objectives/`, `outputs/` directories exist
- **AND** `oprim/config.yaml` contains `mode: portfolio`

#### Scenario: Re-running portfolio init preserves human-written files
- **GIVEN** a portfolio workspace where `oprim/company/overview.md` has been edited
- **WHEN** the user runs `oprim init --mode portfolio` again
- **THEN** `oprim/company/overview.md` is unchanged

#### Scenario: Product init is unchanged
- **WHEN** the user runs `oprim init` without `--mode` (or with `--mode product`)
- **THEN** the created files and their contents are byte-identical to the output before this change

### Requirement: Portfolio workspaces SHALL force spec_framework to none
`oprim init --mode portfolio` SHALL write `integrations.spec_framework: none` without prompting for a framework. `oprim doctor` and `oprim validate` SHALL report a required failure when `mode: portfolio` is combined with any other `spec_framework` value, or when any `oprim/bets/pending/*/specs/` directory exists in a portfolio workspace.

#### Scenario: No framework prompt in portfolio init
- **WHEN** the user runs `oprim init --mode portfolio`
- **THEN** no spec framework prompt is shown
- **AND** `oprim/config.yaml` contains `spec_framework: none`

#### Scenario: Spec framework edited back on
- **GIVEN** a portfolio workspace whose config was edited to `spec_framework: native`
- **WHEN** `oprim validate` runs
- **THEN** it reports a required failure `portfolio: spec_framework must be none (portfolio workspaces never hold specs — see PDR-001)`

### Requirement: Portfolio personal files SHALL live outside oprim/ and never be parsed by the CLI
`STATE.md`, `inbox.md`, `wiki/` and `outputs/` SHALL be created at the project root, outside `oprim/`, so remote-context resolution (which exports only `oprim/`) never shares them with products. `oprim doctor` and `oprim validate` SHALL check only that they exist in portfolio mode (non-required) and SHALL NOT parse their content.

#### Scenario: Remote context export excludes personal files
- **GIVEN** a portfolio workspace with content in `inbox.md` and `wiki/log.md`
- **WHEN** a product resolves that workspace with `oprim context --source <portfolio>`
- **THEN** the printed content includes files under `oprim/` only
- **AND** contains nothing from `inbox.md`, `STATE.md`, `wiki/` or `outputs/`

#### Scenario: Missing personal file
- **GIVEN** a portfolio workspace where `inbox.md` was deleted
- **WHEN** `oprim doctor` runs
- **THEN** it shows a non-required warning suggesting `oprim init --mode portfolio` to restore it

### Requirement: oprim update SHALL merge portfolio config keys only in portfolio workspaces
`oprim update` SHALL add missing portfolio-only keys (`products: []`) using the same append-only, never-reformat merge as existing schema keys, and SHALL do so only when `mode: portfolio` is set. On a product workspace, `oprim update` SHALL produce the same `config.yaml` as before this change.

#### Scenario: Update on a portfolio workspace missing products
- **GIVEN** a portfolio `config.yaml` with no `products:` key
- **WHEN** the user runs `oprim update`
- **THEN** `products: []` is appended
- **AND** every pre-existing line is unchanged

#### Scenario: Update on a product workspace
- **GIVEN** a product `config.yaml` with no `mode` key
- **WHEN** the user runs `oprim update`
- **THEN** `config.yaml` contains no `mode` and no `products` key afterwards

### Requirement: Portfolio scaffold files SHALL honour the OKF frontmatter setting
Each scaffolded `oprim/company/*.md` file SHALL begin with an OKF frontmatter block (`type: company-context`, `title`, `description`, `tags`, `timestamp`) when OKF frontmatter is enabled, and SHALL have no frontmatter when it is disabled. Root personal files (`STATE.md`, `inbox.md`, `wiki/log.md`) SHALL follow the same rule with `type: pm-state`, `type: inbox`, `type: wiki-log`.

#### Scenario: OKF on
- **WHEN** the user runs `oprim init --mode portfolio` and enables OKF frontmatter
- **THEN** `oprim/company/glossary.md` starts with `---` and contains `type: company-context`

#### Scenario: OKF off
- **WHEN** the user runs `oprim init --mode portfolio` and declines OKF frontmatter
- **THEN** `oprim/company/glossary.md` starts with a markdown heading, not `---`
