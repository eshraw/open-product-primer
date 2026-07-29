# Decision: BET-002 Add task lists for grouping related tasks

## Status
- Decision: Build now
- Date: 2026-06-20
- Owner: Demo Author
- Review date: 2026-07-05

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — Grouping is a common ask once a task list grows past a handful of items, but not yet validated for this specific product.
- **Usability risk**: Low — A named list is a familiar pattern (most todo apps have one).
- **Feasibility risk**: Low — Extends the existing flat task model with an optional `list` field; no new infrastructure.
- **Business viability risk**: Low — Internal demo product, no revenue or legal exposure.

## Why now
- Testers of BET-001's flat list said it gets hard to scan past ~15 tasks with no grouping — this is the next-most-requested gap.

## Alternatives considered
- Nested projects/folders — rejected per PDR-001, keep grouping flat (one level, no nesting).

## Expected outcomes
- Users with 15+ tasks can scan their list faster once grouped — baseline (no grouping, informal complaint) → target: informal usability check shows faster task lookup, before this bet is called done.

## Kill criteria / rollback trigger
- If usability testing shows grouping adds more confusion than it resolves, drop the feature and keep the flat list.

## Links
- PDRs: PDR-001
- OpenSpec change: N/A (native oprim spec)
