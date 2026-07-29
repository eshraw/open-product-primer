# PDR-002: Store tasks locally, no account system for v1

## Status
Accepted

## Context
Before building task CRUD (BET-001), we had to decide whether the todo app needs user accounts and server-side storage, or can start local-only.

## Decision
v1 stores all tasks locally on-device. There is no sign-up, login, or server-side sync. Every task-management feature (add/complete/delete, lists, due dates) is designed to work fully offline against local storage.

## Alternatives considered
- Accounts + server sync from day one — rejected: authentication, multi-device sync, and data-loss handling are a lot of surface area for a v1 whose main open question is "does the core task-tracking loop work at all."
- Optional anonymous cloud backup — rejected for v1: adds a background-sync failure mode to design around before we've validated the core loop is worth syncing.

## Consequences
- Positive: No auth system to build or secure; users can try the app with zero setup.
- Trade-offs: No cross-device access; a cleared local store loses all data. Users are not warned about this yet.
- Follow-ups: Revisit once retention data shows people keep using the app past a first session — that's the signal that losing local data would actually hurt.

## Evidence
- N/A — pre-launch decision, no usage data yet.

## Related
- Bets: BET-001
- OpenSpec: N/A (native oprim spec)
- Supersedes: none
