## Context

`criteria.yaml` per bet already defines metrics with `source.type` (amplitude or bigquery), event/table mappings, baseline, target, timeframe, and launch date. The integration surface (mapping tables, artifact formats, review flow) is documented in `openspec/specs/kpi-automation-pipeline/design.md`; this change design formalises that intent and makes it executable via `oprim measure`.

Currently there is no CLI surface to generate or run measurements. The `/oprim:review` skill prompts the user for actuals manually. `oprim doctor` already validates that `AMPLITUDE_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS` are present in the environment but nothing uses them.

## Goals / Non-Goals

**Goals:**
- `oprim measure BET-NNN` command generates Amplitude JSON + BigQuery SQL files from `criteria.yaml`
- Execution step calls Amplitude Chart API and BigQuery API and writes a `run-YYYY-MM-DD.yaml` result
- `/oprim:review` auto-populates from a run result when one exists
- Dry-run mode generates files without calling APIs

**Non-Goals:**
- Scheduling or continuous polling of metrics (one-shot on demand only)
- Support for source types other than `amplitude` and `bigquery`
- Storing historical run results beyond the file written per run date
- Dashboarding or visualisation of results

## Decisions

### 1. Separate generation from execution

**Decision:** `oprim measure` has two sub-steps — `generate` (write definition files) and `run` (call APIs) — with an explicit `--dry-run` flag to stop after generation.

**Rationale:** Generation is deterministic and safe to run at any time; execution requires live credentials and incurs API costs. Separating them lets users inspect generated queries before running, and lets CI generate definitions without needing API keys.

**Alternative considered:** Single command that always calls APIs. Rejected because it couples credential availability to a task (query authoring) that shouldn't need it.

### 2. Measurement files live under `primer/bets/BET-NNN/measurements/`

**Decision:** Generated files are co-located with the bet, not in a top-level `measurements/` directory.

**Rationale:** Keeps the full story of a bet (decision → criteria → measurements → review) in one directory. Consistent with how `criteria.yaml` is scoped per bet.

**Alternative considered:** Central `primer/measurements/` directory. Rejected because it splits related artifacts across the tree.

### 3. Run result is a YAML file, not written back to criteria.yaml

**Decision:** Actuals are written to `measurements/run-YYYY-MM-DD.yaml`, not merged into `criteria.yaml`.

**Rationale:** `criteria.yaml` is the contract (immutable intent). Run results are observations against that contract. Keeping them separate preserves the contract's integrity and supports multiple runs over time.

### 4. `/oprim:review` ingests run result as primary source, falls back to manual

**Decision:** When a `run-YYYY-MM-DD.yaml` exists, `/oprim:review` reads actuals from it. When none exists, it falls back to prompting the user for each metric.

**Rationale:** Avoids requiring a run result to create a review (useful for early or partial reviews), while eliminating manual entry when data is available.

## Risks / Trade-offs

- **Amplitude API shape may drift** → Measurement generation targets a stable chart definition format; if the Amplitude API changes, only the execution layer needs updating, not the criteria schema.
- **BigQuery credentials scope** → `GOOGLE_APPLICATION_CREDENTIALS` must have `bigquery.jobs.create` and `bigquery.tables.getData` on the relevant project. `oprim doctor` will surface this as a warning if credentials are present but insufficient.
- **Run results can go stale** → A run from weeks ago may be used to populate a review. Review artifact includes `run_date` to make staleness visible. No auto-expiry — user's responsibility to re-run before reviewing.
- **Rate limits** → Amplitude and BigQuery both impose quotas. `oprim measure` runs metrics sequentially, not in parallel, to avoid burst failures.

## Open Questions

- Should `oprim measure` accept a `--date` flag to override the run date (useful for backdated reviews)? Deferred — add if requested.
- Should the Amplitude execution use the Chart API or the newer Dashboard REST API? Chart API is more stable for event-funnel queries; revisit if Amplitude deprecates it.
