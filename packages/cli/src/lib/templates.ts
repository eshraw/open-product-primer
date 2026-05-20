export function configTemplate(projectName: string, openspecEnabled: boolean, graphifyEnabled: boolean): string {
  return `version: 1
project:
  name: "${projectName}"
integrations:
  openspec:
    enabled: ${openspecEnabled}
    changes_dir: openspec/changes
  graphify:
    enabled: ${graphifyEnabled}
    graph_dir: graphify-out
measurement:
  amplitude:
    enabled: false
  bigquery:
    enabled: false
    metabase_url: null
sequencing:
  wip_limits:
    now: 2
`;
}

export const sequenceTemplate = `wip_limits:
  now: 2

now: []
next: []
later: []
backlog: []
`;

export const pdrTemplate = `# PDR-XXX: <Decision title>

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
`;

export const betDecisionTemplate = `# Decision: BET-XXX <Bet title>

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
`;

export const criteriaTemplate = `metrics:
  - id: metric_id
    name: "Metric name"
    baseline: 0.00
    target: 0.00
    timeframe: "30 days post-launch"
    launch_date: "YYYY-MM-DD"
    source:
      type: amplitude
      definition:
        event: event_name
        aggregation: unique_users
        denominator_event: null
    segment: null
`;

export const kpiReviewTemplate = `# KPI Review: BET-XXX

**Review date:** YYYY-MM-DD
**Reviewed by:** <name>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| <metric name> | - | - | - | pending |

## Decision quality
<Did outcomes validate the decision? What would you do differently?>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
`;
