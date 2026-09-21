## ADDED Requirements

### Requirement: cross-bet-conflict-detection SHOULD surface overlapping requirement headers live at spec-delta-authoring time
In addition to the existing on-demand check performed by `oprim validate`, the system SHOULD detect and surface a matching `### Requirement:` header across active bets' `specs/<capability>/spec.md` deltas at the moment a delta is written, via a hook, rather than only when `oprim validate` is next run.

#### Scenario: Live conflict notice on matching write
- **GIVEN** two active bets, `BET-A` and `BET-B`, both have a delta for capability `foo`
- **WHEN** `BET-A`'s delta is written or updated with a `### Requirement:` header matching (whitespace-insensitive) a header already present in `BET-B`'s delta for `foo`
- **THEN** a non-blocking, informational notice is surfaced identifying `BET-B`, the capability, and the overlapping requirement header

#### Scenario: No notice when no overlap exists
- **WHEN** a spec delta is written and no other active bet's delta for the same capability shares a matching requirement header
- **THEN** no live notice is surfaced

#### Scenario: Live check degrades silently when unavailable
- **GIVEN** the underlying hooks system is unavailable or fails
- **WHEN** a spec delta is written
- **THEN** the write proceeds without a live notice, and `oprim validate`'s own on-demand overlap check is unaffected
