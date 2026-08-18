# Decision: BET-029 Add explore and reconcile commands to oprim
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — a think-first phase and drift reconciliation address real gaps, but their value depends on users forming the habit of reaching for them
- **Usability risk**: Medium — two new commands to learn; they need clear scoping against the existing bet/discovery skills to avoid overlap confusion
- **Feasibility risk**: Low — mostly skill/command content authoring, which is oprim's core competency; no heavy backend
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- oprim has no "think before committing" phase — the bet flow jumps to a decision artifact; OpenSpec's `explore` fills exactly this gap
- oprim artifacts (PDR ↔ bet ↔ criteria ↔ review) can drift with no reconciliation command; OpenSpec's `update` reconciles artifacts for coherence without editing code
- Both are content-driven (oprim's strength), so technical risk is low and they can ship independently of the spec-layer bets
- Deferred: lower strategic priority than the spec layer, config, and stores work

## Alternatives considered
- Rely on the existing bet/discovery skills for exploration (no dedicated think-first phase)
- Handle reconciliation manually during KPI review

## Expected outcomes
- An `explore` command supports investigating a problem and comparing candidate bets before a decision is written
- A reconcile/`update` command detects and fixes drift across linked oprim artifacts
- Fewer half-formed bets and fewer stale cross-artifact links

## Kill criteria / rollback trigger
- The commands go unused, or they overlap confusingly with existing bet/discovery skills

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Spec (delta): oprim/bets/pending/BET-029-add-explore-and-reconcile-commands-to/specs/explore-reconcile-commands/spec.md
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/commands.md
