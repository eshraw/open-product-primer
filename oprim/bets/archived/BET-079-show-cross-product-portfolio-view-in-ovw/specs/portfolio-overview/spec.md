## ADDED Requirements

### Requirement: oprim ovw --portfolio SHALL render every product's board deterministically
In portfolio mode, `oprim ovw --portfolio` SHALL resolve each `products:` entry whose status is not `sunset` through remote context, read its `oprim/sequence.yaml`, and print per product: name, owner/squad, Now and Next entries (ID + title), and Now load as `<count>/<wip_limits.now>`. It SHALL also print the portfolio's own Now/Next. Output SHALL be computed from files only, with no agent involvement, and SHALL be identical across runs for identical inputs. Outside portfolio mode `--portfolio` SHALL exit non-zero with a message naming `mode: portfolio`.

#### Scenario: Two products
- **GIVEN** products `checkout` (Now: 2 of limit 2) and `search` (Now: 1 of limit 3)
- **WHEN** the user runs `oprim ovw --portfolio`
- **THEN** the output has a section per product showing `checkout now 2/2` and `search now 1/3` with their Now/Next bets

#### Scenario: Stale or unreachable product
- **GIVEN** `search` is a git source that fails to fetch but has a cached clone
- **WHEN** the user runs `oprim ovw --portfolio`
- **THEN** the `search` section is shown with a `(stale)` marker
- **AND** a product with no cache is listed as `unreachable` rather than aborting the command

#### Scenario: Used in a product workspace
- **WHEN** the user runs `oprim ovw --portfolio` in a workspace with no `mode: portfolio`
- **THEN** the command exits non-zero with `--portfolio requires mode: portfolio in oprim/config.yaml`

### Requirement: The portfolio view SHALL surface cross-product dependency problems
The view SHALL list every qualified `blocked_by` reference, across the portfolio and all products, that is unresolved, and every one that is out of order: the blocked bet is in Now while its blocker is in Later, Backlog, or not on its product's board and not archived.

#### Scenario: Out-of-order dependency
- **GIVEN** `checkout:BET-031` is in Now with `blocked_by: [search:BET-014]` and `search:BET-014` is in Later
- **WHEN** the user runs `oprim ovw --portfolio`
- **THEN** a "Dependencies" section lists `checkout:BET-031 (now) blocked by search:BET-014 (later)`

### Requirement: The portfolio view SHALL surface objective coverage gaps
The view SHALL list active objectives with no bet in Now or Next in the portfolio or any product (direct link or via a delegated bet), and Now/Next bets across the portfolio and products that link to no objective.

#### Scenario: Objective with nothing in flight
- **GIVEN** `OBJ-002` is Active and only linked from bets in Later lanes
- **WHEN** the user runs `oprim ovw --portfolio`
- **THEN** a "Coverage" section lists `OBJ-002 has no bet in now/next`

### Requirement: The portfolio view SHALL surface overdue reviews and missing criteria
The view SHALL list pending bets across the portfolio and products whose `Review date` is before today, and promoted bets with no `criteria.yaml` (the same rule as `checkBetDefinitionOfDone`).

#### Scenario: Overdue review
- **GIVEN** today is 2027-01-10 and `checkout:BET-031` has `Review date: 2027-01-05`
- **WHEN** the user runs `oprim ovw --portfolio`
- **THEN** a "Hygiene" section lists `checkout:BET-031 review overdue (2027-01-05)`

### Requirement: The portfolio view SHALL be available as JSON and as a parseable markdown file
`--json` SHALL print the full view model as JSON. `--write` SHALL write `oprim/portfolio-view.md`: with OKF frontmatter enabled, it SHALL start with a frontmatter block (`type: portfolio-view`, `timestamp`) and include one YAML-frontmatter-compatible list per section (`products`, `dependencies`, `coverage`, `hygiene`) so Obsidian Dataview or Notion import can read fields; with OKF disabled it SHALL be plain markdown tables. Terminal output SHALL contain no ANSI codes when stdout is not a TTY.

#### Scenario: JSON
- **WHEN** the user runs `oprim ovw --portfolio --json`
- **THEN** stdout parses as JSON with keys `products`, `dependencies`, `coverage`, `hygiene`

#### Scenario: Markdown with OKF on
- **GIVEN** OKF frontmatter enabled
- **WHEN** the user runs `oprim ovw --portfolio --write`
- **THEN** `oprim/portfolio-view.md` starts with `---` and its frontmatter contains `type: portfolio-view` and a `products` list

### Requirement: Doctor and validate SHALL check WIP limits per product and across the portfolio
In portfolio mode, `oprim doctor` and `oprim validate` SHALL emit a non-required failure for each product whose Now count exceeds its own `wip_limits.now`, and, when the portfolio's `sequence.yaml` sets `wip_limits.portfolio_now`, for a total Now count (portfolio + all non-sunset products) above it.

#### Scenario: Portfolio-wide WIP exceeded
- **GIVEN** `wip_limits.portfolio_now: 5`, portfolio Now 1, `checkout` Now 2, `search` Now 3
- **WHEN** `oprim doctor` runs
- **THEN** it shows a non-required failure `portfolio: WIP limit exceeded (6 active across 3 workspaces, limit 5)`
