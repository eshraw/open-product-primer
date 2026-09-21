# Tasks: BET-052 Surface cross-bet conflicts live via checker mod

## 1. Hook wiring
- [x] 1.1 Register a write hook on `oprim/bets/pending/BET-NNN*/specs/<capability>/spec.md` paths
- [x] 1.2 On fire, resolve the capability and bet ID from the written path
- [x] 1.3 Call `findCrossBetConflicts()` scoped to that capability across all other active bet directories (via `oprim validate --json`, reusing `checkCrossBetConflicts()` — same shell-out pattern as the sibling spec-delta-drift-interceptor mod, since a hooks module can't import internal TS libs directly)

## 2. Live notice surfacing
- [x] 2.1 Render a non-blocking, informational notice when a matching `### Requirement:` header is found in another active bet's delta
- [x] 2.2 Identify the conflicting bet ID, capability, and requirement header text in the notice
- [x] 2.3 No notice when no overlap is found

## 3. Guardrails
- [x] 3.1 Confirm hook failures/unavailability degrade silently (no-op) rather than blocking the write
- [x] 3.2 Verify `oprim validate`'s own `findCrossBetConflicts()` check is unaffected by the live hook (hook only reads `validate --json` output, never modifies detection logic)
