# Decision: BET-019 Add quick-capture mode to bet creation to reduce idea abandonment
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- Current oprim-bet asks 8 fields in one pass — high cognitive load when capturing a fleeting idea
- BET-013 (atomic notes) addresses lightweight capture at the note level; this complements it at the bet level
- Ideas captured quickly and enriched later are better than ideas lost to friction
- The skill already validates the title; adding a "quick mode" flag is a minimal change

## Alternatives considered
- Keep full 8-field flow — current state; works for planned bets, fails for spontaneous ideas
- Use atomic notes (BET-013) as the only lightweight capture point — different granularity; notes ≠ bets
- Lower field count permanently — loses fidelity for teams that need the full structure

## Expected outcomes
- Bet creation rate increases; more ideas enter the system rather than being abandoned
- Quick-capture bets are enriched to full detail within 1 week for >60% of cases

## Kill criteria / rollback trigger
- Quick-capture bets are rarely enriched; half-formed bets clutter the board without being promoted

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
