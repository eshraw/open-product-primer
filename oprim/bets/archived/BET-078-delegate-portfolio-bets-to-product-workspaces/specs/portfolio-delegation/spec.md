## ADDED Requirements

### Requirement: /oprim:delegate SHALL create a linked product bet only after explicit confirmation for local-path products
A bundled `delegate` workflow (`modes: [portfolio]`) invoked as `/oprim:delegate <BET-NNN> --to <product>` SHALL resolve `<product>` through `products:` → `remote_context.sources`. For a local-path source it SHALL show the full product bet draft, its target path and the `sequence.yaml` backlog entry, and SHALL write nothing to the product until the user confirms. It SHALL assign the product bet's ID from the product's own `oprim/bets/{pending,archived}/` using the same rule as `oprim-bet`.

#### Scenario: Confirmed local delegation
- **GIVEN** portfolio bet `BET-004` and product `checkout` registered with `path: ../checkout` whose highest bet is `BET-030`
- **WHEN** the user runs `/oprim:delegate BET-004 --to checkout` and confirms
- **THEN** `../checkout/oprim/bets/pending/BET-031-<slug>/bet-decision.md` is created with `- Delegated from: <portfolio>:BET-004`
- **AND** `BET-031` is appended to `../checkout/oprim/sequence.yaml` backlog
- **AND** the portfolio bet gains `- Delegated to: checkout:BET-031`

#### Scenario: Declined local delegation
- **WHEN** the user declines the confirmation
- **THEN** no file in `../checkout` is created or modified
- **AND** the portfolio bet is unchanged

### Requirement: Delegation to git products SHALL produce a handoff file and never write to a repository or push
For a git source, the delegate workflow SHALL write `outputs/handoffs/<product>-<BET-NNN>.md` containing the ready-to-paste bet-decision, the backlog entry, the `Delegated from` back-link and instructions for the product owner, and SHALL record `- Delegated to: <product>:pending-handoff` on the portfolio bet. It SHALL NOT write under `~/.oprim/remote-context-cache/`, create commits or branches, or run any git push.

#### Scenario: Git product handoff
- **GIVEN** product `search` registered with `git: git@host:org/search.git`
- **WHEN** the user runs `/oprim:delegate BET-006 --to search`
- **THEN** `outputs/handoffs/search-BET-006.md` exists
- **AND** the portfolio bet shows `- Delegated to: search:pending-handoff`
- **AND** no file under the remote-context cache directory has changed

#### Scenario: Handoff applied by the product
- **GIVEN** the search team created `BET-014` from the handoff with `- Delegated from: acme-portfolio:BET-006`
- **WHEN** the user re-runs `/oprim:delegate BET-006 --to search --link BET-014`
- **THEN** the portfolio bet's line becomes `- Delegated to: search:BET-014`

### Requirement: A delegated portfolio bet SHALL follow the product bet's status without copying it
The portfolio bet SHALL store only the qualified reference. Its delegated status (product lane, pending/archived, `Decision`) SHALL be read from the product at display time by the reference resolver and SHALL NOT be written into any portfolio file.

#### Scenario: Product archives the delegated bet
- **GIVEN** `checkout:BET-031` has moved to `oprim/bets/archived/`
- **WHEN** `oprim ovw --portfolio` runs
- **THEN** portfolio `BET-004` is shown as delegated → `checkout:BET-031 (archived)`
- **AND** no portfolio file was modified

### Requirement: Validate SHALL check that delegated pairs exist on both sides with matching back-links
For every `- Delegated to: <product>:BET-MMM` in a portfolio bet, `oprim validate` SHALL resolve the product bet and require a `- Delegated from: <portfolio-source>:BET-NNN` line naming the same portfolio bet. A `pending-handoff` value SHALL be reported as a passing check annotated `pending handoff`. A missing product bet or mismatched back-link SHALL be a required failure.

#### Scenario: Back-link missing on product side
- **GIVEN** portfolio `BET-004` says `Delegated to: checkout:BET-031` and `checkout:BET-031` has no `Delegated from` line
- **WHEN** `oprim validate` runs in the portfolio
- **THEN** it reports a required failure `delegation: checkout:BET-031 has no back-link to BET-004`

#### Scenario: Back-link points elsewhere
- **GIVEN** `checkout:BET-031` says `Delegated from: acme-portfolio:BET-009`
- **WHEN** `oprim validate` runs for portfolio `BET-004`
- **THEN** it reports a required failure naming both IDs
