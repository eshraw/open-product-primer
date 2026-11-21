# Decision: BET-075 Add portfolio workspace mode and scaffold to oprim init
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2026-12-05

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — a scaffold alone delivers little; value only shows once PM workflows (BET-080) and the registry (BET-076) sit on top of it.
- **Usability risk**: Low — one flag on an existing command (`oprim init --mode portfolio`); product users never see it.
- **Feasibility risk**: Low — `config-merge.ts` and `templates.ts` already support additive keys and scaffold files; the only new logic is a mode guard.
- **Business viability risk**: Low — additive, opt-in; product mode must stay byte-identical, which existing tests enforce.

## Why now
- Every other portfolio bet (BET-076–BET-081) needs a place to branch on: a `mode` key and a portfolio layout. Without it each bet would invent its own detection.
- PDR-001 fixes the layout split (citable `oprim/` vs personal root files); encoding it in `init` first stops later bets from drifting from it.
- Cheapest, most reversible slice — a good first 2-way door ahead of the 1-way reference syntax (BET-076).

## Alternatives considered
- Separate `oprim portfolio init` command — rejected in PDR-001 (duplicates init, splits mental model).
- Scaffold preset only (docs + copyable folder, no `mode` key) — rejected: doctor/validate/ovw would have no deterministic way to know a workspace is a portfolio.
- Add `mode: product` to every existing config on `oprim update` — rejected: changes every product repo's config for no behavioural gain; absent `mode` already means `product`.

## Expected outcomes
- `oprim init --mode portfolio` produces a workspace with `oprim/{handbook,objectives}/`, `STATE.md`, `inbox.md`, `wiki/`, `outputs/`, `mode: portfolio`, `spec_framework: none` in one run.
- 0 existing tests changed or failing; `oprim init`/`oprim update` on a product project produce byte-identical output to before.
- `oprim update` on a portfolio workspace adds missing portfolio keys without rewriting any existing line.
- Workflow schemas gain an optional `modes:` field and the hard-coded install lists in `install-agent.ts`/`workflow-renderer.ts` are derived from schemas, so BET-077/080/081 can ship portfolio-only workflows without touching product installs.

## Kill criteria / rollback trigger
- Keeping product mode byte-identical requires changing existing product-mode code paths beyond a single guard per command → stop and revisit approach (b) from PDR-001.
- Within two weeks of dogfooding, the scaffolded `oprim/handbook/` + root files are not used by any workflow draft → collapse the scaffold to config-only.

## Links
- PDRs: PDR-001
- Objectives: None (objectives land in BET-077)
- OpenSpec change: <to be filled when promoted>
