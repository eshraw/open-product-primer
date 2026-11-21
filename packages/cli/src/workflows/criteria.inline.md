### Criteria authoring (oprim-criteria)
Create or append to `oprim/bets/pending/BET-NNN/criteria.yaml`.

1. Ask which bet (e.g. BET-042). Verify dir exists.
<!-- oprim:portfolio:start -->
1b. Before drafting any criteria content, ask 2–3 questions about the assumptions it rests on and wait for the answers (skip if `rules.criteria.ask_first` is false).
<!-- oprim:portfolio:end -->
2. Gather: metric ID (snake_case), name, baseline, target, timeframe, launch date, segment.
3. Ask source type (amplitude / bigquery).
   - Amplitude: event, aggregation (unique_users/event_count/property_sum), denominator_event.
   - BigQuery: table, metric_column, filter, aggregation, denominator_query.
4. If file exists: append to `metrics` list (never overwrite). If not: create.
5. Ask if adding more metrics.
6. Report what was created.