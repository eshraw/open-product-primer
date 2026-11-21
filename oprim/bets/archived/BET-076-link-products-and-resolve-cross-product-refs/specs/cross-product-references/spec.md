## ADDED Requirements

### Requirement: A portfolio config SHALL register products by naming existing remote_context sources
Each `products:` entry SHALL have a `source` field naming a `remote_context.sources` entry, and MAY have `owner`, `squad`, `objectives` (list of objective references) and `status` (`active` | `paused` | `sunset`, default `active`). A product entry SHALL NOT carry its own `git` or `path` field.

#### Scenario: Valid product entry
- **GIVEN** `remote_context.sources` contains `{name: checkout, path: ../checkout}`
- **AND** `products:` contains `{source: checkout, owner: Dana, squad: payments, status: active}`
- **WHEN** `oprim doctor` runs in portfolio mode
- **THEN** no product-registry failure is reported for `checkout`

#### Scenario: Product names an unregistered source
- **GIVEN** `products:` contains `{source: search}` and no `remote_context.sources` entry is named `search`
- **WHEN** `oprim validate` runs
- **THEN** it reports a required failure `products: search is not a registered remote_context source — run 'oprim context register'`

#### Scenario: Product entry duplicates linking fields
- **GIVEN** a `products:` entry has a `git:` field
- **WHEN** `oprim validate` runs
- **THEN** it reports a required failure telling the user to move `git` into `remote_context.sources` (PDR-001: one linking mechanism)

### Requirement: oprim SHALL recognise qualified references of the form <source>:<ID>
A qualified reference SHALL match `^([a-z0-9][a-z0-9-]*):((BET|PDR|OBJ|NOTE)-\d+)$`. The qualifier SHALL be a `remote_context.sources` name. An unqualified ID SHALL always refer to the current workspace.

#### Scenario: Parse a qualified bet reference
- **WHEN** the resolver parses `checkout:BET-012`
- **THEN** it returns `{ source: "checkout", kind: "BET", id: "BET-012" }`

#### Scenario: Unqualified ID stays local
- **WHEN** the resolver parses `BET-012`
- **THEN** it returns a local reference and does not consult any remote source

### Requirement: Qualified references SHALL resolve through remote context in both product and portfolio mode
The resolver SHALL use `resolveFull()` from `lib/remote-context.ts` and look the ID up in the source's workspace: `BET` in `oprim/bets/pending/` then `oprim/bets/archived/` (directory `BET-NNN` or `BET-NNN-<slug>`), `PDR` in `oprim/decisions/PDR-NNN-*.md`, `OBJ` in `oprim/objectives/OBJ-NNN-*.md`, `NOTE` in `oprim/notes/NOTE-NNN-*.md`. It SHALL report the artifact's state (`pending` | `archived` for bets, the `## Status` value for PDRs/objectives) read at resolution time and SHALL NOT write it anywhere. Each source SHALL be resolved at most once per command invocation.

#### Scenario: Reference to an archived bet
- **GIVEN** `checkout`'s workspace has `oprim/bets/archived/BET-012-add-wallet/`
- **WHEN** the resolver resolves `checkout:BET-012`
- **THEN** it returns `found` with state `archived`

#### Scenario: Product cites a portfolio PDR
- **GIVEN** a product workspace (no `mode` key) with source `acme-portfolio` registered
- **AND** the portfolio has `oprim/decisions/PDR-003-data-retention.md`
- **WHEN** a product bet's `requires_pdrs` contains `acme-portfolio:PDR-003` and `oprim doctor` runs
- **THEN** the reference resolves and no failure is reported

#### Scenario: Many references to one git source
- **GIVEN** 20 references to `checkout:` in one workspace
- **WHEN** `oprim validate` runs
- **THEN** `checkout` is cloned or fetched at most once

### Requirement: Cross-product reference checks SHALL distinguish unreachable sources from missing artifacts
For every qualified reference in `sequence.yaml` (`blocked_by`, `unlocks`, `requires_pdrs`) and in bet `## Links` lines, `oprim doctor` and `oprim validate` SHALL report: an unknown qualifier as a required failure; an unreachable source with no cache as a non-required failure; an unreachable source served from a stale cache as a passing check annotated `stale`; a reachable source missing the artifact as a required failure.

#### Scenario: Artifact missing in a reachable product
- **GIVEN** `checkout` resolves and has no `BET-099`
- **WHEN** `oprim validate` runs on a board containing `blocked_by: [checkout:BET-099]`
- **THEN** it reports a required failure `ref: checkout:BET-099 not found in checkout` and exits non-zero

#### Scenario: Offline with a last-known-good cache
- **GIVEN** `checkout` is a git source whose fetch fails but a previous full clone exists
- **WHEN** `oprim doctor` runs
- **THEN** references into `checkout` are checked against the cached clone and annotated `(stale)`

#### Scenario: Unknown qualifier
- **WHEN** a bet lists `- Delegated to: chekout:BET-031` and no source `chekout` exists
- **THEN** `oprim validate` reports a required failure `ref: unknown source "chekout"`

### Requirement: A remote context identity MAY declare the workspace mode
`.oprim-context/context.yaml` MAY carry `mode: portfolio`. `oprim context init` SHALL write it when the current workspace is in portfolio mode. Consumers SHALL treat a source whose identity has `mode: portfolio` as a portfolio source; a missing `mode` SHALL mean `product`.

#### Scenario: Portfolio declares itself citable
- **GIVEN** a workspace with `mode: portfolio`
- **WHEN** the user runs `oprim context init`
- **THEN** `.oprim-context/context.yaml` contains `mode: portfolio`

#### Scenario: Product lists its portfolio source
- **GIVEN** a product with sources `acme-portfolio` (identity `mode: portfolio`) and `design-system` (no mode)
- **WHEN** the user runs `oprim context list`
- **THEN** `acme-portfolio` is labelled `portfolio`
