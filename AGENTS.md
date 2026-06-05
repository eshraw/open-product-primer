<!-- oprim:start -->

## oprim workflows

### Bet authoring (oprim-bet)
Create a new bet in `oprim/bets/` and register it on the sequencing board.

1. Show naming tip: "verb + object [for context] — e.g. 'Improve bet naming for scannability'"
2. Ask for the bet title. Validate: fewer than 4 words OR fewer than 25 chars → warn, suggest reformulation, ask "Proceed anyway? (y/N)".
3. Assign next BET ID: scan `oprim/bets/BET-(\d+)` dirs, max+1 zero-padded to 3 digits (default 001).
4. Check `oprim/sequence.yaml` exists — stop if not, advise `oprim init`.
5. Gather: decision (default Build now), owner, review date (YYYY-MM-DD), why now, alternatives, expected outcomes, kill criteria, PDR links.
6. Write `oprim/bets/BET-NNN/bet-decision.md` with all fields.
7. Append to `oprim/sequence.yaml` backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`.
8. Ask: "Scaffold a discovery.md now? (y/N)" — if "y", write `oprim/bets/BET-NNN/discovery.md`.
9. Report what was created.

### Criteria authoring (oprim-criteria)
Create or append to `oprim/bets/BET-NNN/criteria.yaml`.

1. Ask which bet (e.g. BET-042). Verify dir exists.
2. Gather: metric ID (snake_case), name, baseline, target, timeframe, launch date, segment.
3. Ask source type (amplitude / bigquery).
   - Amplitude: event, aggregation (unique_users/event_count/property_sum), denominator_event.
   - BigQuery: table, metric_column, filter, aggregation, denominator_query.
4. If file exists: append to `metrics` list (never overwrite). If not: create.
5. Ask if adding more metrics.
6. Report what was created.

### PDR authoring (oprim-pdr)
Create a new Product Decision Record in `oprim/decisions/`.

1. Ask for decision title.
2. Assign next PDR ID: scan `oprim/decisions/PDR-(\d+)-`, max+1 zero-padded to 3 digits (default 001).
3. Gather: context, decision, alternatives, consequences, evidence, related bets/specs.
4. Ask if superseding an existing PDR.
5. Write `oprim/decisions/PDR-NNN-<slug>.md`. If superseding, update old PDR Status.
6. Report what was created.

### KPI review (oprim-review)
Create a KPI review artifact in `oprim/reviews/`.

1. Ask which bet (e.g. BET-042).
2. Read `oprim/bets/BET-NNN/criteria.yaml` for pre-fill. Check `oprim/bets/BET-NNN/measurements/` for `run-*.yaml` — use most recent if present.
3. If no run result, ask for each metric's actual value.
4. Status: actual >= target → hit; actual < target → missed; not provided → pending.
5. Ask reviewer name and decision quality notes.
6. Write `oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md`.
7. Report what was created.

### Bet archiving (oprim-archive)
Archive a completed bet.

1. Ask for bet ID (accept bet-005, 005, 5, BET-005 — normalize to BET-NNN).
2. Verify `oprim/bets/BET-NNN/` exists.
3. Check `oprim/sequence.yaml` for entries where `blocked_by` or `unlocks` reference the target bet — warn if found, ask "Archive anyway? (y/N)".
4. Move directory: `oprim/bets/BET-NNN → oprim/bets/archived/BET-NNN`.
5. Remove the bet entry from `oprim/sequence.yaml`.
6. Report what was done.
<!-- oprim:end -->
