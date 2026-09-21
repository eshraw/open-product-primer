# Design: BET-052 Surface cross-bet conflicts live via checker mod

## Approach
Reuse `findCrossBetConflicts()` (`packages/cli/src/lib/spec-delta.ts`) as the detection primitive — it already knows how to compare `### Requirement:` headers (whitespace-insensitive) across all active bets' `specs/<capability>/spec.md` deltas. The new work is wiring it into a live hook rather than only `oprim validate`'s on-demand pass.

Hook point: same as BET-051 (spec-delta writes) — a `tool.call` (or equivalent) hook fires when `oprim/bets/pending/BET-NNN*/specs/<capability>/spec.md` is written, re-runs `findCrossBetConflicts()` scoped to that capability across all other active bets, and surfaces any match as a non-blocking, informational notice rather than an error.

## Alternatives considered
- Status quo: catch conflicts only at `oprim validate`/CI time — cheaper to ship but leaves conflicting deltas undetected for the duration of both bets' authoring.

## Key decisions
- Surface as a heads-up, not a hard block — the other bet's author may not be in this session, so blocking the write would be disruptive and possibly wrong (the other delta may itself be abandoned/in-progress).
- Reuse `findCrossBetConflicts()` as-is rather than forking detection logic, so `validate`'s and the live hook's notion of "conflict" never drifts apart.

## Risks
- **Feasibility**: depends on the still-unverified live function-hooks system (`CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`) and needs read access to all active bets' deltas at hook time, not just the file being written.
- **Usability**: needs careful framing (heads-up, not error) to avoid false alarms from in-progress, not-yet-committed deltas on the other bet.

## Kill criteria (from bet-decision.md)
- If the hooks system doesn't materialize by the review date, kill.
- If live conflict surfacing produces too many false positives from in-progress deltas, kill or rescope.
