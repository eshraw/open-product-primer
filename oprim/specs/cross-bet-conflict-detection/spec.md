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
