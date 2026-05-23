## Why

`criteria.yaml` defines *what* to measure and *where* the data lives, but today the review flow is entirely manual — a user must go pull numbers from Amplitude or BigQuery themselves and type them in. The pipeline to translate criteria contracts into runnable queries and feed actuals back into reviews doesn't exist yet. This change builds that bridge.

## What Changes

- **New**: `oprim measure BET-NNN` CLI command that reads `criteria.yaml` and emits runnable measurement definitions (Amplitude JSON, BigQuery SQL) under `primer/bets/BET-NNN/measurements/`
- **New**: Measurement execution step that calls Amplitude Chart API and BigQuery API, writes a `run-YYYY-MM-DD.yaml` result file with actuals and hit/missed/pending status per metric
- **New**: `/oprim:review` auto-populates from a completed measurement run when one exists, falling back to manual entry when it doesn't
- **Modified**: `kpi-automation-pipeline` spec extended with concrete, testable requirements for generation and execution (existing spec is high-level intent only)

## Capabilities

### New Capabilities
- `measurement-generation`: Translate `criteria.yaml` metric entries into Amplitude chart definition JSON and BigQuery SQL files, one output file per metric per source type
- `measurement-execution`: Run generated definitions against Amplitude Chart API and BigQuery API, write a structured `run-YYYY-MM-DD.yaml` result with actuals and status

### Modified Capabilities
- `kpi-automation-pipeline`: Add ADDED requirements covering the generation-to-execution-to-review data flow and the measurement file formats

## Impact

- `packages/cli/src/commands/` — new `measure.ts` command
- `primer/bets/BET-NNN/measurements/` — new output directory per bet
- `primer/config.yaml` — `AMPLITUDE_API_KEY` and `GOOGLE_APPLICATION_CREDENTIALS` already flagged by `oprim doctor`; execution step reads these from env
- `/oprim:review` skill — updated to detect and ingest a run result file before prompting for manual entry
- No breaking changes to existing `criteria.yaml` schema
