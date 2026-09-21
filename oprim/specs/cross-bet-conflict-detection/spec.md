## ADDED Requirements

### Requirement: validate SHALL surface overlapping requirement headers across active bets on demand
The system SHALL provide a way to check, across all active bet directories under `oprim/bets/` (excluding `archived/`), whether two or more bets' `specs/<capability>/spec.md` deltas contain a `### Requirement:` header for the same capability that matches (whitespace-insensitive), without requiring any bet to be in the process of archiving.

#### Scenario: Two active bets overlap on the same requirement
- **WHEN** `oprim validate` runs and `BET-009` and `BET-010` both have a delta for capability `foo` containing a `### Requirement:` header with matching text
- **THEN** validate reports a failing check identifying both bet IDs, the capability, and the overlapping requirement header

#### Scenario: No overlap among active bets
- **WHEN** `oprim validate` runs and no two active bets' deltas share a matching requirement header for the same capability
- **THEN** no overlap check failure is reported

#### Scenario: Overlap check runs independent of archiving
- **WHEN** `oprim validate` is run at any time, with no bet currently being archived
- **THEN** the overlap check still executes and reports any overlaps found among all currently active bets

### Requirement: validate SHALL flag dangling sequence dependency references as part of the same on-demand check
This requirement extends `doctor-sequence-integrity`'s dangling `blocked_by`/`unlocks` check by making it available through `oprim validate`'s exit-code-bearing report, in addition to `oprim doctor`'s informational report.

#### Scenario: Dangling reference surfaced via validate
- **WHEN** `oprim validate` runs and `oprim/sequence.yaml` has an entry with `blocked_by: [BET-999]` where `BET-999` does not exist in any lane
- **THEN** validate includes the same dangling-reference check as `oprim doctor`, and it participates in `validate`'s pass/fail and exit-code determination

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
