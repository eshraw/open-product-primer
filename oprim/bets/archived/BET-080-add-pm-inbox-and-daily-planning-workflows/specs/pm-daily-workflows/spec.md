## ADDED Requirements

### Requirement: oprim-capture SHALL append a timestamped item to inbox.md without asking anything else
A bundled `capture` workflow (`modes: [portfolio]`) SHALL append the given text to `inbox.md` as `- [ ] <YYYY-MM-DD HH:MM> <text>`, creating the file if missing, and SHALL NOT ask follow-up questions or route the item.

#### Scenario: Quick capture
- **WHEN** the user runs `oprim-capture "checkout latency complaints from sales"`
- **THEN** `inbox.md` ends with `- [ ] 2026-11-21 14:05 checkout latency complaints from sales`

### Requirement: /oprim:triage SHALL route each open inbox item with one question per item
A bundled `triage` workflow SHALL iterate over unchecked `inbox.md` items and, for each, ask exactly one AskUserQuestion with the options: NOTE in a named product, portfolio NOTE, personal task (to `STATE.md`), discard. It SHALL propose the most likely product from `products:` and `wiki/products/`. Routing to a product SHALL show the target path and require confirmation before writing; git products SHALL get a handoff entry under `outputs/handoffs/` instead. Each routed item SHALL be checked off with its destination appended (`→ checkout:NOTE-012`, `→ discarded`).

#### Scenario: Route to a local product
- **GIVEN** an inbox item mentioning checkout and product `checkout` with a local path
- **WHEN** the user runs `/oprim:triage` and picks "NOTE in checkout", then confirms
- **THEN** a new `NOTE-NNN` is created in `checkout`'s `oprim/notes/`
- **AND** the inbox line becomes `- [x] … → checkout:NOTE-NNN`

#### Scenario: Discard
- **WHEN** the user picks "discard" for an item
- **THEN** no file other than `inbox.md` changes and the line becomes `- [x] … → discarded`

### Requirement: /oprim:ingest SHALL update wiki/ from a meeting note and propose destinations for decisions
A bundled `ingest` workflow invoked with a meeting-note path SHALL append dated entries to `wiki/log.md` and to the relevant `wiki/people/<name>.md`, `wiki/products/<product>.md` and `wiki/decisions/` pages (append-only — existing lines SHALL NOT be edited or removed). For each extracted decision it SHALL propose one destination — wiki log only, portfolio PDR candidate, product PDR candidate, note candidate or bet candidate — and SHALL write nothing outside `wiki/` without confirmation, and nothing in a product workspace without a separate confirmation.

#### Scenario: Append-only wiki update
- **GIVEN** `wiki/people/dana.md` with three existing entries
- **WHEN** the user runs `/oprim:ingest meetings/2026-11-21-checkout-sync.md`
- **THEN** the existing three entries are unchanged and new dated entries are appended

#### Scenario: Product PDR candidate needs confirmation
- **WHEN** ingest extracts "checkout will drop guest checkout" and proposes a product PDR candidate for `checkout`
- **THEN** nothing is written to `checkout` until the user confirms that destination

### Requirement: /oprim:start-day and /oprim:plan-week SHALL work from STATE.md, the portfolio view and the inbox, with calendar and chat optional
Both workflows SHALL read `STATE.md`, the open items in `inbox.md` and `oprim ovw --portfolio --json` (falling back to the portfolio's own `sequence.yaml` if the view is unavailable), and SHALL update `STATE.md` sections `Focus`, `In progress`, `Blockers` and `Last commands`. They SHALL use calendar or Slack MCP tools only if such tools are available in the session and SHALL complete normally when none are.

#### Scenario: No MCP servers
- **GIVEN** a session with no calendar or Slack tools
- **WHEN** the user runs `/oprim:start-day`
- **THEN** it produces a day plan from STATE.md, inbox and boards, and updates `STATE.md`
- **AND** it does not report an error about missing integrations

#### Scenario: Calendar available
- **GIVEN** a calendar MCP tool is available
- **WHEN** the user runs `/oprim:plan-week`
- **THEN** the plan includes the week's meetings alongside board items

### Requirement: Drafting workflows SHALL ask assumption questions first in portfolio mode
Before drafting a bet, PDR, criteria entry, objective or comms document, the workflow SHALL ask 2–3 questions about the assumptions the draft rests on and wait for answers, when the workspace is in portfolio mode and `rules.<workflow>.ask_first` is not `false`. In product mode the step SHALL be skipped unless `rules.<workflow>.ask_first` is `true`. The installed product-mode skill text SHALL be byte-identical to before this change.

#### Scenario: Portfolio default
- **GIVEN** a portfolio workspace with no `rules.bet.ask_first`
- **WHEN** the user runs `oprim-bet`
- **THEN** 2–3 assumption questions are asked before any bet content is drafted

#### Scenario: Turned off per workflow
- **GIVEN** a portfolio workspace with `rules: { pdr: { ask_first: false } }`
- **WHEN** the user runs `oprim-pdr`
- **THEN** no assumption questions are asked

#### Scenario: Product mode unchanged
- **WHEN** `oprim update` runs in a product workspace
- **THEN** the installed `oprim-bet` skill is byte-identical to the version before this change
