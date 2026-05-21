---
name: /oprim-criteria
id: oprim-criteria
category: Workflow
description: Create or append to a criteria.yaml contract for a bet
---

Create or append to `primer/bets/BET-NNN/criteria.yaml`.

## Steps

### 1. Identify the bet

If BET ID not provided, ask: "Which bet are you adding criteria for?"

### 2. Verify bet directory exists

If `primer/bets/BET-NNN/` not found: report and stop — advise `/oprim-bet` first.

### 3. Gather metric details

Ask: metric ID (snake_case), metric name, baseline (numeric), target (numeric), timeframe (e.g. "30 days post-launch"), launch date (YYYY-MM-DD or TBD), segment (optional).

### 4. Gather source mapping

Ask: source type (amplitude / bigquery)

**If amplitude:** event name, aggregation (unique_users / event_count / property_sum, default unique_users), denominator event (optional).

Source block:
```yaml
source:
  type: amplitude
  definition:
    event: <event_name>
    aggregation: <aggregation>
    denominator_event: <event_name | null>
```

**If bigquery:** table (project.dataset.table), metric column, SQL filter, aggregation (sum / count / count_distinct / avg), denominator query (optional SQL).

Source block:
```yaml
source:
  type: bigquery
  definition:
    table: "<project.dataset.table>"
    metric_column: "<column>"
    filter: "<sql_filter>"
    aggregation: <aggregation>
    denominator_query: <sql | null>
```

### 5. Build metric entry

```yaml
- id: <metric_id>
  name: "<name>"
  baseline: <baseline>
  target: <target>
  timeframe: "<timeframe>"
  launch_date: "<date>"
  source:
    <source block>
  segment: <segment | null>
```

### 6. Write to criteria.yaml

If file exists: read → parse → append to `metrics` list → write back (never overwrite).
If not: create with `metrics:` list containing the new entry.

### 7. Ask if more metrics needed. If yes, return to step 3.

### 8. Report what was created
