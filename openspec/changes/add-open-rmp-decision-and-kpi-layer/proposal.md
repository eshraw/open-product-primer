## Why

Teams already using OpenSpec and Graphify can define and implement changes quickly, but they still lack a durable decision layer for product prioritization and post-launch learning. The missing capability is deciding what to build in what order, preserving why decisions were made, and automatically comparing expected outcomes to KPI results.

## What Changes

- Add a Product Decision Intelligence layer (`open-rmp`) that complements OpenSpec without duplicating implementation details.
- Introduce Product Decision Records (PDRs) for durable product decisions, separate from bet-level prioritization decisions.
- Add sequencing support (`Now/Next/Later`) with explicit bet dependencies, unlock chains, and PDR preconditions.
- Add KPI automation workflow for criteria imported from Notion into repo-native contracts, then measured via Amplitude and BigQuery/Metabase.
- Define a promotion contract from bet decisions to OpenSpec changes so authority boundaries stay clear.
- Include ready-to-use templates for PDRs, bet decisions, criteria contracts, sequencing board, and KPI reviews.
- Add a reproducible **project installation** model (`open-rmp init` / `update` / `doctor`) so any repo can bootstrap the toolkit like OpenSpec or Graphify.

## Capabilities

### New Capabilities
- `project-installation`: Install and bootstrap open-rmp per repository with CLI commands, config, roadmap scaffold, and agent slash-command integration.
- `product-decision-records`: Define and maintain durable product decisions with status, alternatives, consequences, and links to bets/specs.
- `sequencing-board`: Manage `Now/Next/Later` prioritization with blockers, unlocks, WIP limits, and PDR preconditions.
- `kpi-automation-pipeline`: Convert structured success criteria into executable Amplitude and BigQuery/Metabase measurements and write outcome reviews.
- `openspec-promotion-contract`: Promote prioritized bets into OpenSpec changes with explicit linking and anti-duplication rules.

### Modified Capabilities
- None.

## Impact

- **Distribution**: npm (or equivalent) global CLI package with `init`, `update`, and `doctor` commands for repeatable project setup.
- **Artifacts**: new roadmap decision and sequencing artifacts under `roadmap/`, project config at `roadmap/config.yaml`, and OpenSpec-aligned promotion links under `openspec/changes/`.
- **Agent workflows**: adds new command surface (`/rmp:*`) installed into supported AI assistants on `init`/`update`, with review loops before and after `/opsx:*`.
- **Data integrations**: uses Amplitude and BigQuery/Metabase as measurement backends via criteria contracts.
- **Traceability**: enables Graphify to connect decisions, specs, code, events, and outcomes.
- **Ecosystem**: detects OpenSpec and Graphify presence during init and configures integration hooks when present.

## Ready-to-use Templates

### Project config (`roadmap/config.yaml`)

```yaml
version: 1
project:
  name: "<project-name>"
integrations:
  openspec:
    enabled: true
    changes_dir: openspec/changes
  graphify:
    enabled: true
    graph_dir: graphify-out
measurement:
  amplitude:
    enabled: true
  bigquery:
    enabled: true
    metabase_url: null
sequencing:
  wip_limits:
    now: 2
```

### Product Decision Record (`roadmap/decisions/PDR-XXX-name.md`)

```md
# PDR-XXX: <Decision title>

## Status
Proposed | Accepted | Deprecated | Superseded by PDR-YYY

## Context
<What forced this decision?>

## Decision
<Clear statement of what is decided>

## Alternatives considered
- <Alternative A and why rejected>
- <Alternative B and why rejected>

## Consequences
- Positive: <...>
- Trade-offs: <...>
- Follow-ups: <...>

## Evidence
- <Research link>
- <Data link>

## Related
- Bets: <BET-IDs>
- OpenSpec: <change paths>
- Supersedes: <PDR-ID or none>
```

### Bet Decision (`roadmap/bets/BET-XXX/bet-decision.md`)

```md
# Decision: BET-XXX <Bet title>

## Status
- Decision: Build now | Defer | Kill
- Date: YYYY-MM-DD
- Owner: <name>
- Review date: YYYY-MM-DD

## Why now
- <prioritization rationale>

## Alternatives considered
- <alternative + reason>

## Expected outcomes
- <metric: baseline -> target in timeframe>

## Kill criteria / rollback trigger
- <condition and action>

## Links
- PDRs: <PDR-IDs>
- OpenSpec change: <path once promoted>
```

### Criteria Contract (`roadmap/bets/BET-XXX/criteria.yaml`)

```yaml
metrics:
  - id: activation_rate
    name: "Activation rate"
    baseline: 0.40
    target: 0.55
    timeframe: "30 days post-launch"
    launch_date: "YYYY-MM-DD"
    source:
      type: amplitude
      definition:
        event: onboarding_complete
        aggregation: unique_users
        denominator_event: signup_complete
    segment: new_users
```

### Sequencing Board (`roadmap/sequence.yaml`)

```yaml
wip_limits:
  now: 2

now:
  - id: BET-042
    title: "Onboarding redesign"
    blocked_by: []
    unlocks: [BET-051]
    requires_pdrs: [PDR-011, PDR-018]

next:
  - id: BET-051
    title: "In-app guidance"
    blocked_by: [BET-042]
    unlocks: []
    requires_pdrs: [PDR-011]

later: []
backlog: []
```

### KPI Review (`roadmap/reviews/YYYY-MM-DD-BET-XXX-kpi.md`)

```md
# KPI Review: BET-XXX

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Activation rate | 40% | 55% | 48% | missed |

## Decision quality
<Did outcomes validate the decision?>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
```
