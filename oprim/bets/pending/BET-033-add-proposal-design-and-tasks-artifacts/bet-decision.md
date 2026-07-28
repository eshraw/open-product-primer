# Decision: BET-033 Add proposal, design, and tasks artifacts to native oprim specs
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-27
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium-High — closes the parity gap with OpenSpec and gives BET-032 a real completion signal, but only matters to native-mode adopters
- **Usability risk**: Medium — three more artifacts per bet risks feeling like exactly the OpenSpec ceremony native mode exists to avoid; needs careful scoping to stay lightweight
- **Feasibility risk**: Low-Medium — templates mirror OpenSpec's existing proposal/design/tasks structure closely; the open design question is exactly how tasks.md checklist state should feed `oprim-archive`'s gate
- **Business viability risk**: Low — internal tooling structure only, no licensing/ops concern

## Why now
- Native mode's `oprim-spec` skill only produces a requirements+scenarios delta (`spec.md`) — no equivalent to OpenSpec's `proposal.md` (why/what), `design.md` (technical approach/trade-offs), or `tasks.md` (implementation checklist)
- Without `tasks.md`, there's no structured way to track implementation progress for a native-mode bet — exactly the signal BET-032's pending/archived split needs
- OpenSpec-based bets get `proposal.md`/`design.md`/`tasks.md` for free via `/openspec-propose`; native-mode bets rely on `bet-decision.md` alone, which conflates product decision with technical design and has no task-level granularity
- Natural follow-on to BET-032: pending → archived should ideally be gated on `tasks.md` showing all tasks checked off, not just on someone choosing to run `/oprim:archive`

## Alternatives considered
- Keep using `bet-decision.md` for both product decision and technical design — rejected: mixes altitudes, no per-task tracking
- Require native-mode users to install OpenSpec anyway for proposal/design/tasks — rejected: defeats the purpose of a no-OpenSpec-required native framework
- Generate one combined artifact instead of three separate files — rejected: OpenSpec's three-way split (why/how/checklist) keeps each concern independently scannable, and that separation is worth preserving

## Expected outcomes
- `oprim-spec` (or a new companion skill) generates `oprim/bets/pending/BET-NNN/proposal.md`, `design.md`, and `tasks.md` alongside the existing `spec.md` delta
- `tasks.md` gives a literal checklist inspectable as the implementation-complete signal feeding BET-032's pending → archived transition
- Native mode reaches parity with OpenSpec's artifact set without requiring OpenSpec itself

## Kill criteria / rollback trigger
- If authoring three more artifacts per bet creates more overhead than value for teams who chose native mode specifically to avoid OpenSpec's ceremony, scale back to an optional lightweight `tasks.md` only

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-033-native-spec-artifacts/
- Blocked by: BET-032 (pending/archived split — tasks.md's main value is feeding that gate; also openspec/changes/bet-032-bets-pending-subdir/)
