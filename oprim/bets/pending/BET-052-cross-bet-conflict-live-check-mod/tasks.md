# Tasks: BET-052 Surface cross-bet conflicts live via checker mod

## 1. Hook wiring
- [ ] 1.1 Register a write hook on `oprim/bets/pending/BET-NNN*/specs/<capability>/spec.md` paths
- [ ] 1.2 On fire, resolve the capability and bet ID from the written path
- [ ] 1.3 Call `findCrossBetConflicts()` scoped to that capability across all other active bet directories

## 2. Live notice surfacing
- [ ] 2.1 Render a non-blocking, informational notice when a matching `### Requirement:` header is found in another active bet's delta
- [ ] 2.2 Identify the conflicting bet ID, capability, and requirement header text in the notice
- [ ] 2.3 No notice when no overlap is found

## 3. Guardrails
- [ ] 3.1 Confirm hook failures/unavailability degrade silently (no-op) rather than blocking the write
- [ ] 3.2 Verify `oprim validate`'s own `findCrossBetConflicts()` check is unaffected by the live hook
