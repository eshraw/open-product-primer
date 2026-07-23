# Decision: BET-028 Add oprim validate with strict CI gating
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Defer
- Date: 2026-07-23
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — enforces real discipline (criteria before promote, KPI review before archive), valued by disciplined teams but friction for others
- **Usability risk**: Low — a `validate` command with clear, machine-readable errors is a familiar CLI idiom
- **Feasibility risk**: Low — oprim already has `doctor` and `oprim:sequence` checks to build on; a standalone `validate --strict --json` is a bounded extraction
- **Business viability risk**: Low — no licensing or ops concerns

## Why now
- Validation is currently folded into `doctor` / `oprim:sequence` with no standalone, CI-runnable, machine-readable command
- OpenSpec's `validate --strict --all --json` gating archive is a proven pattern
- oprim's product-decision discipline maps naturally: no promote without a criteria contract, no archive without a KPI review
- Deferred: depends on the spec/delta structure (BET-024) to have something structural to validate against

## Alternatives considered
- Keep validation inside `doctor` / `oprim:sequence` only
- Enforce via hooks only (oprim already has co-archival hooks) rather than a first-class command

## Expected outcomes
- `oprim validate --strict --json` runs in CI and gates promote/archive on the presence of required artifacts
- Board and spec integrity issues surface as machine-readable output
- Teams get an enforceable definition-of-done for bets and specs

## Kill criteria / rollback trigger
- Gating creates more friction than value, or false positives erode trust → relax strict rules to warnings

## Links
- PDRs: None
- OpenSpec change: to be filled when promoted
- Blocked by: BET-024 (spec dir model)
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
