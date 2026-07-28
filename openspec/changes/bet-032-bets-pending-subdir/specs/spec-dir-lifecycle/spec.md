## MODIFIED Requirements

### Requirement: An active bet's native spec changes SHALL be written as a delta under the bet's own directory
While a bet is active (not yet archived), the native spec-authoring skill SHALL write capability spec changes to `oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md`, using `## ADDED Requirements`, `## MODIFIED Requirements`, and `## REMOVED Requirements` headers, rather than writing directly to `oprim/specs/`.

#### Scenario: Native spec authoring writes a delta during an active bet
- **WHEN** a user invokes native spec authoring for a capability while `BET-NNN` is active (not archived)
- **THEN** the resulting delta is written to `oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md` and `oprim/specs/<capability>/spec.md` is left unchanged

#### Scenario: Delta uses OpenSpec-compatible headers
- **WHEN** a delta spec file is generated
- **THEN** it uses `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements` section headers with `### Requirement:` and `#### Scenario:` entries beneath them

### Requirement: Multiple bets SHALL be able to carry delta specs against the same capability concurrently
The system SHALL NOT prevent two or more active bets from each holding a delta spec file for the same capability under their own bet directories.

#### Scenario: Two active bets target the same capability
- **WHEN** `BET-010` and `BET-011` are both active and both have written delta specs for the `foo` capability
- **THEN** both `oprim/bets/pending/BET-010.../specs/foo/spec.md` and `oprim/bets/pending/BET-011.../specs/foo/spec.md` exist simultaneously with no error
