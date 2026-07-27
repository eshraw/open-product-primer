## ADDED Requirements

### Requirement: validate SHALL preview a bet's spec-delta merge result without writing files
The system SHALL provide `oprim validate --diff <BET-ID>`, which, for each `<capability>/spec.md` delta under the given bet's `specs/` directory, computes the result of folding that delta into the corresponding `oprim/specs/<capability>/spec.md` (using the same ADDED-append / MODIFIED-replace / REMOVED-delete rules `/oprim:archive` uses) and prints the computed post-merge content, without writing to `oprim/specs/` or moving the bet directory.

#### Scenario: Preview a delta against existing current truth
- **WHEN** `oprim validate --diff BET-030` runs and `oprim/bets/BET-030-foo/specs/checkout/spec.md` contains an ADDED requirement, and `oprim/specs/checkout/spec.md` already exists
- **THEN** the command prints the resulting `checkout` spec content with the new requirement appended, and `oprim/specs/checkout/spec.md` on disk is unchanged

#### Scenario: Preview a delta with no existing current truth
- **WHEN** `oprim validate --diff BET-030` runs and `oprim/bets/BET-030-foo/specs/newcap/spec.md` contains only ADDED requirements, and `oprim/specs/newcap/spec.md` does not exist
- **THEN** the command prints the new `oprim/specs/newcap/spec.md` content that archiving would create, and no file is written

#### Scenario: Preview a bet with no spec deltas
- **WHEN** `oprim validate --diff BET-030` runs and `oprim/bets/BET-030-foo/specs/` does not exist
- **THEN** the command reports that the bet has no spec deltas to preview, with no error

#### Scenario: Preview an unresolvable bet ID
- **WHEN** `oprim validate --diff BET-999` runs and no bet directory matches `BET-999`
- **THEN** the command reports an error identifying that the bet was not found and exits with a non-zero status code
