## ADDED Requirements

### Requirement: validate SHALL flag MODIFIED/REMOVED delta requirements whose header no longer matches current truth
For each active bet's `specs/<capability>/spec.md` delta, for every `### Requirement:` header under a `## MODIFIED Requirements` or `## REMOVED Requirements` section, `oprim validate` SHALL check whether a `### Requirement:` header with matching text (whitespace-insensitive) exists in `oprim/specs/<capability>/spec.md`. If no match is found, validate SHALL emit a failing check.

#### Scenario: MODIFIED requirement header no longer matches current truth
- **WHEN** `oprim validate` runs and a bet's delta has `## MODIFIED Requirements` with `### Requirement: The system SHALL do X` but `oprim/specs/<capability>/spec.md` has no requirement with matching header text
- **THEN** validate reports a failing check: `spec-delta: BET-NNN's MODIFIED requirement "The system SHALL do X" in <capability> no longer matches current truth`

#### Scenario: REMOVED requirement header no longer matches current truth
- **WHEN** `oprim validate` runs and a bet's delta has `## REMOVED Requirements` with a header that has no match in `oprim/specs/<capability>/spec.md`
- **THEN** validate reports a failing check identifying the bet, capability, and requirement header

#### Scenario: MODIFIED/REMOVED requirement header matches current truth
- **WHEN** `oprim validate` runs and every MODIFIED/REMOVED requirement header in a bet's delta has a whitespace-insensitive match in current truth
- **THEN** no drift check failure is reported for that bet's delta

#### Scenario: ADDED requirements are not subject to this check
- **WHEN** `oprim validate` runs and a bet's delta has `## ADDED Requirements` with a header that does not appear in current truth
- **THEN** no drift check failure is reported for that requirement, since ADDED requirements are expected to be new
