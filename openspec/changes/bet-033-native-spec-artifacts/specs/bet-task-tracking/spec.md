## ADDED Requirements

### Requirement: oprim-spec SHALL generate proposal, design, and tasks artifacts for a native-mode bet
The system SHALL extend the `oprim-spec` skill so that, the first time it is invoked for a given bet (i.e. no `proposal.md`, `design.md`, or `tasks.md` yet exist in that bet's directory), it also writes `oprim/bets/pending/BET-NNN-<slug>/proposal.md` (why/what), `design.md` (technical approach and trade-offs), and `tasks.md` (a flat implementation checklist), alongside the existing `specs/<capability>/spec.md` delta. Subsequent `oprim-spec` invocations for the same bet (e.g. for a different capability) SHALL only write or append to the spec delta, leaving an already-generated `proposal.md`/`design.md`/`tasks.md` untouched.

#### Scenario: First spec-authoring pass for a bet generates all four artifacts
- **WHEN** a user invokes `oprim-spec` for `BET-NNN` and no `proposal.md`, `design.md`, or `tasks.md` exist yet in `oprim/bets/pending/BET-NNN-<slug>/`
- **THEN** the skill writes `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md`, all under `oprim/bets/pending/BET-NNN-<slug>/`

#### Scenario: Second spec-authoring pass for the same bet only touches the spec delta
- **WHEN** a user invokes `oprim-spec` again for `BET-NNN` (a different capability) and `proposal.md`, `design.md`, and `tasks.md` already exist in its bet directory
- **THEN** the skill writes or appends only to `specs/<capability>/spec.md`, leaving the existing `proposal.md`, `design.md`, and `tasks.md` unchanged

### Requirement: tasks.md SHALL use a flat checkbox format matching OpenSpec's convention
`tasks.md` SHALL use `- [ ] N.M <task description>` checkbox items grouped under `## N. <heading>` sections, mirroring the checkbox format OpenSpec's own `tasks.md` uses, so completion state is a simple parse (count of unchecked boxes).

#### Scenario: Generated tasks.md uses the checkbox convention
- **WHEN** `oprim-spec` generates `tasks.md` for a bet
- **THEN** every task line matches `- [ ] <number> <description>`, grouped under numbered `##` headings

### Requirement: tasks.md completion state SHALL be inspectable as an implementation-complete signal
The system SHALL treat a `tasks.md` with zero remaining `- [ ]` (unchecked) items as the implementation-complete signal for a native-mode bet, checkable by any tool or agent without needing to read `bet-decision.md` or ask the user.

#### Scenario: All tasks checked off signals implementation-complete
- **WHEN** every checkbox in a bet's `tasks.md` is `- [x]`
- **THEN** the bet is considered implementation-complete for the purpose of the `oprim:archive` pending-to-archived transition

#### Scenario: Unchecked tasks remain
- **WHEN** at least one checkbox in a bet's `tasks.md` is still `- [ ]`
- **THEN** the bet is not considered implementation-complete
