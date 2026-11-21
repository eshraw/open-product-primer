# Decision: BET-079 Show a cross-product portfolio view in oprim ovw
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2027-01-08

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — "what's every team doing, what's blocked across teams, which OKR has nothing in flight" is the question a PM answers weekly by hand today.
- **Usability risk**: Medium — many products × lanes can overflow a terminal; needs a compact default and a file export.
- **Feasibility risk**: Medium — aggregates N `sequence.yaml` files through remote context; must stay deterministic and fast with stale sources.
- **Business viability risk**: Low — read-only.

## Why now
- Deterministic rendering already exists for a single board (`commands/ovw.ts`); extending it across products is the main *read* payoff of BET-076/077.
- Board-vision rule: the board is the owner's opinion, rendered deterministically — a portfolio view must come from the CLI, not an agent summary.

## Alternatives considered
- Agent-generated weekly summary only (`/oprim:plan-week`) — rejected as the primary view (non-deterministic); kept as a consumer of this view.
- Separate `oprim portfolio status` command — rejected in PDR-001.
- Writing a merged `sequence.yaml` into the portfolio — rejected: copies product content.

## Expected outcomes
- `oprim ovw --portfolio` prints per-product Now/Next with WIP load, unresolved or out-of-order cross-product dependencies, objectives with no Now/Next bet, bets with no objective, overdue reviews (`Review date` < today) and promoted bets missing `criteria.yaml`.
- `--json` emits the same model; `--write` writes `oprim/portfolio-view.md` with OKF frontmatter when enabled (Dataview/Notion-parseable) and plain markdown otherwise.
- Portfolio-wide WIP limit (`wip_limits.portfolio_now`) and per-product WIP checked by `doctor`/`validate`.

## Kill criteria / rollback trigger
- Output for 5 products does not fit in ~60 terminal lines in default mode after one redesign → default to summary counts with per-product drill-down only.
- `--portfolio` on a warm cache takes > 10s for 5 products → defer until resolution is batched.

## Links
- PDRs: PDR-001
- Objectives: None
- OpenSpec change: <to be filled when promoted>
