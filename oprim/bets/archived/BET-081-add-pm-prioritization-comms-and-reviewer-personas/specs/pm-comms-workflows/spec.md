## ADDED Requirements

### Requirement: /oprim:prioritize SHALL propose board changes without applying them
A bundled `prioritize` workflow (`modes: [portfolio]`) SHALL rank pending bets in the portfolio and, read-only, across products by OKR fit (linked active objectives), risk profile and door type, using `oprim ovw --portfolio --json` as input. It SHALL output the ranking with a one-line rationale per bet and a proposed `sequence.yaml` diff for the portfolio only, and SHALL NOT modify any `sequence.yaml`. Changes to a product board SHALL be phrased as suggestions to that product's owner.

#### Scenario: Proposal only
- **WHEN** the user runs `/oprim:prioritize`
- **THEN** a ranked list and a proposed diff are shown
- **AND** every `sequence.yaml` in the portfolio and products is unchanged

#### Scenario: Product board suggestion
- **GIVEN** `checkout:BET-031` serves no active objective and sits in Now
- **WHEN** `/oprim:prioritize` runs
- **THEN** the output contains a suggestion addressed to `checkout`'s owner, not a diff to `checkout`'s board

### Requirement: Comms workflows SHALL write audience-specific drafts to outputs/
`/oprim:stakeholder-update` and `/oprim:roadmap-comms` SHALL ask for the audience (e.g. exec, eng, sales, customers) and period, read the portfolio view, objectives, KPI reviews under each workspace's `oprim/reviews/` and bet decisions, and write a draft to `outputs/<YYYY-MM-DD>-<workflow>-<audience>.md`. Every claim about a bet SHALL cite its qualified reference. They SHALL NOT send, post or publish anything.

#### Scenario: Exec update
- **WHEN** the user runs `/oprim:stakeholder-update` for audience `exec`, period `2027-01`
- **THEN** `outputs/2027-01-31-stakeholder-update-exec.md` is created
- **AND** each bet mentioned is cited as `<source>:BET-NNN`

### Requirement: /oprim:publish SHALL render a one-way Notion-ready PRD from a bet or PDR
`/oprim:publish <ref>` SHALL accept a local or qualified `BET-NNN` or `PDR-NNN`, compose a PRD from the bet decision, its `criteria.yaml` and spec deltas or current-truth specs when present, and write it to `outputs/publish/<ref>.md` as Notion-compatible markdown with a header stating that git is the source of truth. It SHALL NOT call any Notion API unless the user explicitly asks to upload, and SHALL never read changes back from Notion.

#### Scenario: Publish a product bet
- **WHEN** the user runs `/oprim:publish checkout:BET-031`
- **THEN** `outputs/publish/checkout-BET-031.md` is created with sections from the bet, criteria and spec
- **AND** it begins with a "Source of truth: checkout:BET-031 in git" notice
