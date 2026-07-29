<!-- oprim:start -->

## oprim workflows

### Bet authoring (oprim-bet)
Create a new bet in `oprim/bets/pending/` and register it on the sequencing board.

1. Show naming tip: "verb + object [for context] — e.g. 'Improve bet naming for scannability'"
2. Ask for the bet title. Validate: fewer than 4 words OR fewer than 25 chars → warn, suggest reformulation, ask "Proceed anyway? (y/N)".
3. Assign next BET ID: scan `oprim/bets/pending/BET-(\d+)` and `oprim/bets/archived/BET-(\d+)` dirs, max+1 zero-padded to 3 digits (default 001).
4. Check `oprim/sequence.yaml` exists — stop if not, advise `oprim init`.
4b. Read `oprim/config.yaml`'s `rules.bet` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
5. Gather: decision (default Build now), owner, review date (YYYY-MM-DD), why now, alternatives, expected outcomes, kill criteria, PDR links.
6. Write `oprim/bets/pending/BET-NNN/bet-decision.md` with all fields.
7. Append to `oprim/sequence.yaml` backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`.
8. Ask: "Scaffold a discovery.md now? (y/N)" — if "y", write `oprim/bets/pending/BET-NNN/discovery.md`.
9. Report what was created.

### Note authoring (oprim-note)
Create a new note in `oprim/notes/` for lightweight thinking capture — not a bet, no owner or kill criterion.

1. Ask for a short title.
2. Assign next NOTE ID: scan `oprim/notes/NOTE-(\d+)-`, max+1 zero-padded to 3 digits (default 001).
3. Ask for the note body (free-form), tags, and optional related BET-IDs.
4. Tags: check against `oprim/config.yaml`'s `notes.tags` — accept and append any new tag rather than rejecting it (the vocabulary grows from usage).
5. Check `oprim/templates/note.md`: a `description:` field in its frontmatter means the OKF tier (gather a one-line description); no field means the minimal tier; if the file is missing, fall back to `okf.enabled` in `oprim/config.yaml`.
6. Write `oprim/notes/NOTE-NNN-<slug>.md` with the correct frontmatter tier and a `## Bets` section.
7. For each related bet, append `- Notes: NOTE-NNN` to that bet's `## Links` section.
8. Report what was created.

### Criteria authoring (oprim-criteria)
Create or append to `oprim/bets/pending/BET-NNN/criteria.yaml`.

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
2b. Read `oprim/config.yaml`'s `rules.pdr` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
3. Gather: context, decision, alternatives, consequences, evidence, related bets/specs.
4. Ask if superseding an existing PDR.
5. Write `oprim/decisions/PDR-NNN-<slug>.md`. If superseding, update old PDR Status.
6. Report what was created.

### KPI review (oprim-review)
Create a KPI review artifact in `oprim/reviews/`.

1. Ask which bet (e.g. BET-042).
1b. Read `oprim/config.yaml`'s `rules.review` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
2. Read `oprim/bets/pending/BET-NNN/criteria.yaml` for pre-fill. Check `oprim/bets/pending/BET-NNN/measurements/` for `run-*.yaml` — use most recent if present.
3. If no run result, ask for each metric's actual value.
4. Status: actual >= target → hit; actual < target → missed; not provided → pending.
5. Ask reviewer name and decision quality notes.
6. Write `oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md`.
7. Report what was created.

### Bet archiving (oprim-archive)
Archive a completed bet.

1. Ask for bet ID (accept bet-005, 005, 5, BET-005 — normalize to BET-NNN).
2. Verify `oprim/bets/pending/BET-NNN/` exists.
3. Check `oprim/sequence.yaml` for entries where `blocked_by` or `unlocks` reference the target bet — warn if found. Also check other active bet dirs for delta specs against the same requirement (matching `### Requirement:` headers, whitespace-insensitive) — warn if an overlap is found. Also check the bet's `tasks.md` (if present) for unchecked `- [ ]` items — warn with the count if any remain. Ask "Archive anyway? (y/N)" if any warning fires.
4. If `oprim/bets/pending/BET-NNN/specs/` exists, fold each capability's `## ADDED`/`## MODIFIED`/`## REMOVED Requirements` delta into `oprim/specs/<capability>/spec.md` (matching by `### Requirement:` header; create the current-truth file if the delta is entirely ADDED) — last-write-wins on overlaps, no 3-way merge. Skip this step entirely if no `specs/` dir is present.
5. Move directory: `oprim/bets/pending/BET-NNN → oprim/bets/archived/BET-NNN`.
6. Remove the bet entry from `oprim/sequence.yaml`.
7. Report what was done.

### Sequencing board (oprim-sequence)
Validate the primer sequencing board and regenerate the visual view.

1. **Read board** — load `oprim/sequence.yaml`
2. **Check WIP limits** — compare `now` count against `wip_limits.now`
3. **Validate blockers** — for each bet in `now`, confirm all `blocked_by` entries are complete or absent
4. **Validate PDR preconditions** — confirm all `requires_pdrs` entries exist in `oprim/decisions/`
5. **Report violations** — list any WIP excess, unresolved blockers, or missing PDRs
6. **Suggest moves** — recommend bets to defer to `next` or `later` to resolve violations
7. **Regenerate view** — run `node oprim/scripts/generate-sequence-view.js` from the project root to update `oprim/sequence-view.md`

<!-- oprim:end -->
