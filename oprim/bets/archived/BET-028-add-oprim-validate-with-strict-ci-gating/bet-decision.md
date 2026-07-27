# Decision: BET-028 Add oprim validate with strict CI gating
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-27
- Owner: Eshane
- Review date: 2026-09-30

Updated from Defer: its blocker (BET-024, spec dir model) has shipped (`openspec/changes/archive/2026-07-24-bet-024-spec-dir-lifecycle/`), and BET-028 was moved into the sequencing board's `now` slot unblocked (see `oprim/sequence.yaml`), being built in tandem with BET-027 on the `feat-declarative-schemas-and-validate-ci` branch.

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
- BET-024 shipped the delta structure but no accompanying validation, leaving three specific gaps `validate` should close:
  - No diff/preview of what a bet's `specs/<capability>/spec.md` delta will actually produce when folded into `oprim/specs/<capability>/spec.md` — the merge outcome is invisible until archive runs
  - No mid-lifecycle check that a MODIFIED/REMOVED requirement's header still text-matches its counterpart in current truth — drift between when the delta was authored and when the bet archives fails silently (falls back to append-as-ADDED or is skipped, per `oprim-archive`'s merge logic)
  - No cross-bet conflict visibility before archive time — overlapping requirement headers or dependency conflicts across active bets are only surfaced by the y/N prompt inside `/oprim:archive` itself, with no earlier command to check for them

## Alternatives considered
- Keep validation inside `doctor` / `oprim:sequence` only
- Enforce via hooks only (oprim already has co-archival hooks) rather than a first-class command

## Expected outcomes
- `oprim validate --strict --json` runs in CI and gates promote/archive on the presence of required artifacts
- Board and spec integrity issues surface as machine-readable output
- Teams get an enforceable definition-of-done for bets and specs
- `validate` can dry-run a bet's spec delta against current truth and report the post-merge result without archiving
- `validate` flags MODIFIED/REMOVED requirements whose header no longer matches current truth, before archive time
- `validate` surfaces overlapping requirement headers and dependency conflicts across all active bets on demand, not only during `/oprim:archive`

## Kill criteria / rollback trigger
- Gating creates more friction than value, or false positives erode trust → relax strict rules to warnings

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/bet-028-validate-ci-gating/`
- Blocked by: BET-024 (spec dir model) — shipped, see `openspec/changes/archive/2026-07-24-bet-024-spec-dir-lifecycle/`
- Reference: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
