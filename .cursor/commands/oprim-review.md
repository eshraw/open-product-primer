---
name: /oprim-review
id: oprim-review
category: Workflow
description: Create a KPI review artifact pre-filled from a bet's criteria contract
---

Create KPI review in `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md`. Read `criteria.yaml` for pre-fill (baseline/target). Check `primer/bets/BET-NNN/measurements/` for `run-*.yaml` files — if found, use the most recent to pre-populate actuals and status (include "Actuals from run: YYYY-MM-DD" note). If no run result, ask for each metric's actual value. Status: actual >= target → hit, actual < target → missed, not provided → pending. Ask reviewer name and decision quality notes. Write review with metric table and Actions checklist. Report what was created.