---
name: oprim-criteria
description: Create or append to a criteria.yaml contract for a bet, with structured Amplitude and BigQuery source mapping
---

Create or append to `primer/bets/BET-NNN/criteria.yaml`.

## Steps

### 1. Identify the bet

If a BET ID was not provided, ask: "Which bet are you adding criteria for? (e.g. BET-042)"

### 2. Verify the bet exists

Check that `primer/bets/BET-NNN/` exists. If it does not:
- Report: "Bet directory `primer/bets/BET-NNN/` not found. Run `/oprim:bet` to create the bet first."
- Stop.

### 3. Gather metric details

Ask the following questions:

- **Metric ID**: "What is the snake_case identifier for this metric? (e.g. `activation_rate`, `revenue_per_user`)"
- **Metric name**: "What is the human-readable name? (e.g. 'Activation rate')"
- **Baseline**: "What is the current baseline value? (numeric, e.g. 0.40 for 40%)"
- **Target**: "What is the target value to hit? (numeric)"
- **Timeframe**: "Over what timeframe? (e.g. '30 days post-launch', '7 days post-launch')"
- **Launch date**: "What is the expected launch date? (YYYY-MM-DD, or 'TBD')"
- **Segment**: "Is there a specific user segment to filter? (e.g. 'new_users', or press Enter for none)"

### 4. Gather source mapping

Ask: "What is the data source for this metric? (amplitude / bigquery)"

**If amplitude:**
- "What is the primary event name to measure? (e.g. `onboarding_complete`)"
- "What aggregation? (unique_users / event_count / property_sum) — default: unique_users"
- "Is this a rate metric? If so, what is the denominator event? (e.g. `signup_complete`, or press Enter for none)"

Build the source block:
```yaml
source:
  type: amplitude
  definition:
    event: <event_name>
    aggregation: <aggregation>
    denominator_event: <denominator_event | null>
```

**If bigquery:**
- "What is the full table path? (e.g. `myproject.analytics.events`)"
- "What column holds the metric value? (e.g. `revenue_usd`)"
- "What SQL filter expression should be applied? (e.g. `event_type = 'purchase'`)"
- "What aggregation? (sum / count / count_distinct / avg)"
- "Is this a rate metric? If so, provide the denominator SQL query, or press Enter for none."

Build the source block:
```yaml
source:
  type: bigquery
  definition:
    table: "<project.dataset.table>"
    metric_column: "<column_name>"
    filter: "<sql_filter_expression>"
    aggregation: <sum | count | count_distinct | avg>
    denominator_query: <sql_string | null>
```

### 5. Build the metric entry

```yaml
- id: <metric_id>
  name: "<metric_name>"
  baseline: <baseline>
  target: <target>
  timeframe: "<timeframe>"
  launch_date: "<launch_date>"
  source:
    <source block from step 4>
  segment: <segment | null>
```

### 6. Write to criteria.yaml

**If `primer/bets/BET-NNN/criteria.yaml` already exists:**
Read the file, parse the YAML, append the new metric entry to the `metrics` list, write back.
Never overwrite existing metrics.

**If the file does not exist:**
Create it with this structure:
```yaml
metrics:
  - <new metric entry>
```

### 7. Ask if more metrics needed

Ask: "Do you want to add another metric for this bet? (yes / no)"
If yes, return to step 3.

### 8. Report

```
## Criteria updated: BET-NNN

File: primer/bets/BET-NNN/criteria.yaml
Added: <metric_id> (<source type>)
Total metrics: <count>

Next steps:
- Run /oprim:review BET-NNN after launch to record actuals
```
