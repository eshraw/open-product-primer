# PDR-001: Keep a single flat task list, no nested projects

## Status
Accepted

## Context
Early sketches of the todo app included folders/projects for grouping tasks (à la a full project-management tool). Before building that, we needed to decide whether v1 should support nesting or stay flat.

## Decision
v1 ships with a single flat list per user. Tasks may optionally belong to a named **list** (see BET-002) for light grouping, but lists cannot be nested and a task belongs to at most one list.

## Alternatives considered
- Nested projects/folders (Asana-style) — rejected: adds real complexity (recursive UI, moving subtrees) for a use case (personal task tracking) that rarely needs more than one level of grouping.
- No grouping at all, just one global list — rejected: early user feedback said an undifferentiated list gets unmanageable past ~20 items.

## Consequences
- Positive: Simpler data model and UI; faster to ship and easier to keep the example maintainable.
- Trade-offs: Power users managing many concurrent projects may outgrow this; revisit if that segment grows.
- Follow-ups: If demand for nesting appears, re-open as a new PDR rather than silently expanding this one.

## Evidence
- User interviews (informal): most testers kept fewer than 10 top-level groupings.

## Related
- Bets: BET-002
- OpenSpec: N/A (native oprim spec)
- Supersedes: none
