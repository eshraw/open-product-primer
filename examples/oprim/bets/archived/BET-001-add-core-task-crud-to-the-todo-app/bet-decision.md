# Decision: BET-001 Add core task CRUD to the todo app

## Status
- Decision: Build now
- Date: 2026-06-01
- Owner: Demo Author
- Review date: 2026-06-15

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — Add/complete/delete is the minimum loop any todo app needs; without it there's nothing to test with users.
- **Usability risk**: Low — Well-understood interaction pattern, no novel UX to validate.
- **Feasibility risk**: Low — Local-only storage per PDR-002, no new infrastructure.
- **Business viability risk**: Low — Internal demo product, no revenue or legal exposure.

## Why now
- Nothing else can be built or demoed until the core task loop exists — every later bet (lists, due dates) depends on tasks existing first.

## Alternatives considered
- Start with a richer feature (due dates, priorities) before basic CRUD — rejected: no product to test the richer feature against yet.

## Expected outcomes
- A user can add, complete, and delete a task end to end — baseline (nothing exists) → target: all three actions work reliably, verified by manual testing, within this bet.

## Kill criteria / rollback trigger
- N/A — foundational bet, not killable without killing the product.

## Links
- PDRs: PDR-002
- OpenSpec change: N/A (native oprim spec)
- Spec (delta): oprim/bets/archived/BET-001-add-core-task-crud-to-the-todo-app/specs/task-management/spec.md
