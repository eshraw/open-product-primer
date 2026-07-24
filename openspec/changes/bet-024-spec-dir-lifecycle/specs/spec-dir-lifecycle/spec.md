## ADDED Requirements

### Requirement: oprim SHALL maintain a flat current-truth spec set at oprim/specs/
The system SHALL treat `oprim/specs/<capability>/spec.md` as the current-truth spec set, flat (no `current/` nesting), analogous to OpenSpec's own `specs/` convention.

#### Scenario: Current truth read directly
- **WHEN** any tooling or agent needs to know a capability's current requirements
- **THEN** it reads `oprim/specs/<capability>/spec.md` directly, with no intermediate "current" subdirectory

### Requirement: An active bet's native spec changes SHALL be written as a delta under the bet's own directory
While a bet is active (not yet archived), the native spec-authoring skill SHALL write capability spec changes to `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md`, using `## ADDED Requirements`, `## MODIFIED Requirements`, and `## REMOVED Requirements` headers, rather than writing directly to `oprim/specs/`.

#### Scenario: Native spec authoring writes a delta during an active bet
- **WHEN** a user invokes native spec authoring for a capability while `BET-NNN` is active (not archived)
- **THEN** the resulting delta is written to `oprim/bets/BET-NNN-<slug>/specs/<capability>/spec.md` and `oprim/specs/<capability>/spec.md` is left unchanged

#### Scenario: Delta uses OpenSpec-compatible headers
- **WHEN** a delta spec file is generated
- **THEN** it uses `## ADDED Requirements`, `## MODIFIED Requirements`, or `## REMOVED Requirements` section headers with `### Requirement:` and `#### Scenario:` entries beneath them

### Requirement: Multiple bets SHALL be able to carry delta specs against the same capability concurrently
The system SHALL NOT prevent two or more active bets from each holding a delta spec file for the same capability under their own bet directories.

#### Scenario: Two active bets target the same capability
- **WHEN** `BET-010` and `BET-011` are both active and both have written delta specs for the `foo` capability
- **THEN** both `oprim/bets/BET-010.../specs/foo/spec.md` and `oprim/bets/BET-011.../specs/foo/spec.md` exist simultaneously with no error

### Requirement: This lifecycle model SHALL apply only to the spec layer, not to PDRs
The change/current delta-merge model introduced by this bet SHALL NOT apply to `oprim/decisions/` (PDRs), which continue to evolve exclusively via supersession (`Status: ... | Superseded by PDR-YYY`).

#### Scenario: PDR evolution unaffected
- **WHEN** a PDR's decision changes
- **THEN** the change is recorded via supersession as before, and no delta-spec mechanism is invoked or expected for PDRs
