### KPI review (oprim-review)
Create a KPI review artifact in `oprim/reviews/`.

1. Ask which bet (e.g. BET-042).
1b. Read `oprim/config.yaml`'s `rules.review` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
2. Read `oprim/bets/BET-NNN/criteria.yaml` for pre-fill. Check `oprim/bets/BET-NNN/measurements/` for `run-*.yaml` — use most recent if present.
3. If no run result, ask for each metric's actual value.
4. Status: actual >= target → hit; actual < target → missed; not provided → pending.
5. Ask reviewer name and decision quality notes.
6. Write `oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md`.
7. Report what was created.