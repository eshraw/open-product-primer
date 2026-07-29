# Design: task-management

## Approach
Store tasks as a flat local array (per PDR-002), each with an id, title, and a `completed` boolean. Three operations cover the full loop: add a task (append), toggle complete (flip the boolean), delete a task (remove by id). No editing of task titles in v1 — delete and re-add covers that rare case.

## Key decisions
- **Flat array, no separate "lists" concept yet**: lists are BET-002's concern; this bet only needs a single unscoped collection.
- **Boolean `completed`, not a status enum**: two states (done/not done) is all v1 needs; an enum would be premature for a feature that doesn't exist yet.
- **No title editing**: keeps the interaction surface to exactly three actions, matching the bet's scope.

## Alternatives considered
- Status enum (`todo` / `in_progress` / `done`) — rejected: no evidence users want an in-progress state for simple tasks; adds a decision point to the UI for no validated benefit.

## Risks
- None significant — this is the smallest possible slice of the product.
