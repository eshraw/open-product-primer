## 1. CLI Command Scaffold

- [ ] 1.1 Create `packages/cli/src/commands/measure.ts` with `oprim measure BET-NNN [--dry-run]` command structure
- [ ] 1.2 Register `measure` command in the CLI entry point
- [ ] 1.3 Add bet directory validation (exit non-zero if `primer/bets/BET-NNN/` not found)
- [ ] 1.4 Add `criteria.yaml` validation (exit with helpful message if missing or malformed)

## 2. Measurement Generation

- [ ] 2.1 Implement date window computation from `launch_date` + `timeframe` string
- [ ] 2.2 Implement Amplitude JSON generator — emit `amplitude-<metric_id>.json` per amplitude metric
- [ ] 2.3 Implement BigQuery SQL generator — emit `bigquery-<metric_id>.sql` per bigquery metric
- [ ] 2.4 Handle `launch_date: null` — omit window field, add comment in output
- [ ] 2.5 Create `measurements/` directory if absent before writing files
- [ ] 2.6 Wire `--dry-run` flag to exit after generation without calling APIs

## 3. Measurement Execution — Amplitude

- [ ] 3.1 Read `AMPLITUDE_API_KEY` from environment; skip and mark `pending` if absent
- [ ] 3.2 Implement Amplitude Chart API client for funnel and event-count chart types
- [ ] 3.3 Extract scalar actual from Amplitude API response
- [ ] 3.4 Handle non-2xx responses — log error, mark metric `pending`, continue

## 4. Measurement Execution — BigQuery

- [ ] 4.1 Read `GOOGLE_APPLICATION_CREDENTIALS` from environment; skip and mark `pending` if absent
- [ ] 4.2 Implement BigQuery job submission and polling using the Google Cloud BigQuery client
- [ ] 4.3 Extract first-row first-column scalar from query result
- [ ] 4.4 Handle job failure and zero-row results — log error, mark metric `pending`, continue

## 5. Run Result

- [ ] 5.1 Implement `hit`/`missed`/`pending` status logic (actual ≥ target → hit, actual < target → missed, no actual → pending)
- [ ] 5.2 Write `measurements/run-YYYY-MM-DD.yaml` after all metrics complete
- [ ] 5.3 Overwrite existing run result file for the same date

## 6. /oprim:review Integration

- [ ] 6.1 Update `/oprim:review` skill to scan `measurements/` for the most recent `run-*.yaml`
- [ ] 6.2 Pre-populate review metric table from run result when found (actual + status from run, baseline + target from criteria.yaml)
- [ ] 6.3 Include "Actuals from run: YYYY-MM-DD" note in review artifact when ingesting run result
- [ ] 6.4 Fall back to manual entry prompts when no run result exists (preserve existing behavior)

## 7. oprim doctor Updates

- [ ] 7.1 Scan `primer/bets/*/criteria.yaml` for `source.type: amplitude` usage; fail doctor check if `AMPLITUDE_API_KEY` is unset and amplitude metrics exist
- [ ] 7.2 Scan for `source.type: bigquery` usage; fail doctor check if `GOOGLE_APPLICATION_CREDENTIALS` is unset and bigquery metrics exist
- [ ] 7.3 Pass both checks when no metrics reference the respective source type

## 8. Tests

- [ ] 8.1 Unit test: date window computation for standard and edge-case timeframe strings
- [ ] 8.2 Unit test: Amplitude JSON generator output shape
- [ ] 8.3 Unit test: BigQuery SQL generator output for sum, count_distinct, and rate variants
- [ ] 8.4 Unit test: `hit`/`missed`/`pending` status classification
- [ ] 8.5 Integration test: full `oprim measure --dry-run` against a fixture criteria.yaml
