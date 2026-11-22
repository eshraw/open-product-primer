---
name: oprim-criteria
description: Create or append to a criteria.yaml contract for a bet, with structured Amplitude and BigQuery source mapping
---

Create or append to `oprim/bets/pending/BET-NNN/criteria.yaml`.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you adding criteria for? (e.g. BET-042)"

### 2. Verify bet exists
If `oprim/bets/pending/BET-NNN/` not found: report and stop — advise using the `oprim-bet` skill first.

<!-- oprim:portfolio:start -->
### 2b. Ask about assumptions first
Before drafting any criteria content, ask 2–3 questions about the assumptions it rests on — who it is for, what evidence says the problem is real, and what would have to be true for it to work — and wait for the answers. Use the answers to shape everything you draft next, and record any assumption the user could not answer as an open question in the draft. (If `rules.criteria` in `oprim/config.yaml` is a map, its `text` key is the custom guidance from the step above; `ask_first: false` there turns this step off.)
<!-- oprim:portfolio:end -->

### 3. Gather metric details
Ask: metric ID (snake_case), metric name, baseline (numeric), target (numeric), timeframe, launch date (YYYY-MM-DD or TBD), segment (optional).

### 4. Gather source mapping
Ask: source type (amplitude / bigquery)

If amplitude: event name, aggregation (unique_users / event_count / property_sum), denominator event (optional).
```yaml
source:
  type: amplitude
  definition:
    event: <event_name>
    aggregation: <aggregation>
    denominator_event: <event_name | null>
```

If bigquery: table, metric column, SQL filter, aggregation (sum / count / count_distinct / avg), denominator query (optional).
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

### 5. Build metric entry and write
If file exists: read → parse → append to `metrics` → write back (never overwrite).
If not: create with `metrics:` list.

### 6. Ask if more metrics needed. If yes, return to step 3.

### 7. Report what was created
