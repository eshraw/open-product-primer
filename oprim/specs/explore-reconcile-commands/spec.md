## Requirements

### Requirement: The oprim CLI SHALL provide an `explore` command for think-first investigation before a bet is drafted
`/oprim:explore` gives a user a way to investigate a problem and compare candidate framings without committing to a bet, filling the gap between "I noticed something" and the existing bet-drafting flow.

#### Scenario: Explore a problem before committing to a bet
- **GIVEN** a user has an open problem or opportunity with no bet drafted yet
- **WHEN** they run `/oprim:explore`
- **THEN** oprim surfaces related PDRs and notes, and guides the user through comparing candidate framings or approaches
- **AND** no `bet-decision.md` is written during explore itself

#### Scenario: Explore hands off to bet drafting
- **GIVEN** a user has narrowed exploration down to a single candidate framing they want to commit to
- **WHEN** they finish an `/oprim:explore` session
- **THEN** oprim points them to `/oprim:bet` to draft the decision artifact
- **AND** explore does not itself write a `bet-decision.md`

### Requirement: The oprim CLI SHALL provide a `reconcile` command that detects drift across linked oprim artifacts
`/oprim:reconcile` checks cross-references between PDRs, bets, criteria, and reviews (e.g. a bet's PDR link, a criteria.yaml's bet link, a review's criteria link) for staleness or breakage, since these links can drift with no dedicated command to catch it today.

#### Scenario: Detect a stale or broken cross-artifact link
- **GIVEN** a PDR, bet, criteria.yaml, and review exist with cross-references between them
- **WHEN** the user runs `/oprim:reconcile`
- **THEN** oprim checks each reference (PDR ↔ bet, bet ↔ criteria, bet ↔ review) for staleness or breakage
- **AND** reports every drifted or broken link found, with no report emitted for links that are still valid

### Requirement: The `reconcile` command SHALL report each detected drift and require per-item confirmation before applying any fix
Reconcile never silently rewrites artifacts; each proposed fix is surfaced individually so the user stays in control of what changes.

#### Scenario: User confirms a suggested fix
- **GIVEN** reconcile has detected a drifted link and proposed a fix
- **WHEN** the user confirms that specific fix
- **THEN** oprim applies only that fix to the relevant artifact file
- **AND** leaves all other detected drift unmodified until separately confirmed

#### Scenario: User declines a suggested fix
- **GIVEN** reconcile has detected a drifted link and proposed a fix
- **WHEN** the user declines that fix
- **THEN** oprim leaves the artifact unchanged and continues to the next detected drift, if any
