---
name: /oprim-criteria
id: oprim-criteria
category: Workflow
description: Create or append to a criteria.yaml contract for a bet
---

Add metrics to `primer/bets/BET-NNN/criteria.yaml`. Verify bet dir exists. Gather: metric ID, name, baseline, target, timeframe, launch date, segment. Ask source type (amplitude or bigquery). Amplitude: event, aggregation, denominator_event. BigQuery: table, metric_column, filter, aggregation, denominator_query. If file exists: append to metrics list (never overwrite). If not: create. Ask if adding more metrics. Report what was created.