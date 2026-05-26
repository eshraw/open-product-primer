# KPI automation integration surface

Reference for criteria-to-measurement mapping, generated artifact formats, and the post-measurement review flow. Normative requirements live in `spec.md` and in `measurement-generation`, `measurement-execution`, and `kpi-review-authoring` capability specs.

## Criteria-to-measurement mapping

Each metric in `primer/bets/BET-XXX/criteria.yaml` maps to one or more runnable measurement definitions based on its `source.type`.

### Amplitude source

```yaml
source:
  type: amplitude
  definition:
    event: onboarding_complete          # primary event to count
    aggregation: unique_users           # unique_users | event_count | property_sum
    denominator_event: signup_complete  # for rate metrics; null for absolute counts
```

| criteria field | Amplitude concept |
|----------------|-------------------|
| `event` | chart event filter |
| `aggregation: unique_users` | Unique Users metric |
| `aggregation: event_count` | Event Totals metric |
| `denominator_event` | Formula: event_A / event_B (rate) |
| `segment` | Segment filter by user property |
| `timeframe` | Date range relative to `launch_date` |

### BigQuery source

```yaml
source:
  type: bigquery
  definition:
    table: "project.dataset.events"
    metric_column: "revenue_usd"
    filter: "event_type = 'purchase'"
    aggregation: sum               # sum | count | count_distinct | avg
    denominator_query: null        # optional SQL for rate denominator
```

| criteria field | BigQuery concept |
|----------------|------------------|
| `table` | FROM clause |
| `filter` | WHERE clause |
| `metric_column` | SELECT target |
| `aggregation` | aggregate function |
| `denominator_query` | subquery for rate denominator |
| `timeframe` | WHERE date BETWEEN launch_date AND launch_date + interval |

## Generated output format

### Amplitude measurement definition (`primer/bets/BET-XXX/measurements/amplitude-<metric_id>.json`)

```json
{
  "metric_id": "activation_rate",
  "name": "Activation rate",
  "baseline": 0.40,
  "target": 0.55,
  "launch_date": "2024-03-01",
  "timeframe": "30 days post-launch",
  "window": {
    "start": "2024-03-01",
    "end": "2024-03-31"
  },
  "amplitude": {
    "chart_type": "funnel",
    "events": ["signup_complete", "onboarding_complete"],
    "aggregation": "unique_users",
    "segment_filters": []
  }
}
```

### BigQuery measurement definition (`primer/bets/BET-XXX/measurements/bigquery-<metric_id>.sql`)

```sql
-- Metric: activation_rate
-- Baseline: 0.40 | Target: 0.55 | Window: 2024-03-01 to 2024-03-31
SELECT
  COUNT(DISTINCT CASE WHEN event_type = 'onboarding_complete' THEN user_id END)
    / COUNT(DISTINCT CASE WHEN event_type = 'signup_complete' THEN user_id END) AS activation_rate
FROM `project.dataset.events`
WHERE DATE(event_timestamp) BETWEEN '2024-03-01' AND '2024-03-31'
```

### Measurement run result (`primer/bets/BET-XXX/measurements/run-YYYY-MM-DD.yaml`)

```yaml
run_date: "2024-04-01"
bet: BET-042
metrics:
  - id: activation_rate
    baseline: 0.40
    target: 0.55
    actual: 0.48
    status: missed        # hit | missed | pending
    source: amplitude
    notes: "Funnel drop at step 3 (email verification)"
```

## Review artifact update flow

After a measurement run, KPI review and upstream decision artifacts are updated in sequence.

### Step 1 — Write KPI review

Create or update `primer/reviews/YYYY-MM-DD-BET-XXX-kpi.md` from the run result:

```markdown
# KPI Review: BET-XXX

**Review date:** YYYY-MM-DD
**Reviewed by:** <name>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Activation rate | 40% | 55% | 48% | missed |

## Decision quality
<Did outcomes validate the decision? What would you do differently?>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
```

### Step 2 — Update bet decision

Add an `## Outcomes` section to `primer/bets/BET-XXX/bet-decision.md`:

```markdown
## Outcomes
- Activation rate: 40% → 48% (target 55%) — missed
- Review: primer/reviews/2024-04-01-BET-042-kpi.md
```

### Step 3 — Update PDRs (if outcomes change decisions)

If outcomes invalidate or supersede a referenced PDR, update its status:

```markdown
## Status
Superseded by PDR-YYY  <!-- if outcomes forced a new decision -->
```

### Step 4 — Sequencing recommendations

Based on outcomes, `/oprim:sequence` may surface:

| Outcome | Recommendation |
|---------|----------------|
| Metrics missed | Defer follow-on bets (`next` → `later`) until root cause resolved |
| Metrics hit | Unlock dependent bets (`blocked_by` satisfied) |
| Kill criteria triggered | Move associated bets to `backlog` |
