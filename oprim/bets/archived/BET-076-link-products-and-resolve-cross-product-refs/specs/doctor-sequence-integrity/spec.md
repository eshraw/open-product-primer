## ADDED Requirements

### Requirement: Doctor SHALL hand qualified sequence references to the cross-product check instead of flagging them as dangling
The dangling `blocked_by` and `unlocks` checks SHALL apply only to unqualified IDs. An entry matching `<source>:<ID>` SHALL NOT be checked against local lanes and SHALL NOT produce a `sequence: dangling … reference` warning; it is resolved by the cross-product reference check (see `cross-product-references`). An entry that YAML parsed as a map (e.g. `checkout: BET-012`, with a space) SHALL produce a non-required warning suggesting the unspaced form.

#### Scenario: blocked_by holds a qualified cross-product reference
- **WHEN** `oprim doctor` runs and a bet has `blocked_by: [checkout:BET-012]`
- **THEN** no `sequence: dangling blocked_by reference` warning is emitted for it
- **AND** the reference is resolved by the cross-product reference check instead

#### Scenario: unlocks holds a qualified cross-product reference
- **WHEN** `oprim doctor` runs and a bet has `unlocks: [search:BET-004]`
- **THEN** no `sequence: dangling unlocks reference` warning is emitted for it

#### Scenario: Unqualified dangling references still warn
- **WHEN** `oprim doctor` runs and a bet has `blocked_by: [BET-999]` and `BET-999` is in no lane
- **THEN** doctor still outputs `sequence: dangling blocked_by reference BET-999`

#### Scenario: Reference written with a space
- **WHEN** a bet has `blocked_by: [checkout: BET-012]`
- **THEN** doctor outputs a non-required warning `sequence: BET-NNN blocked_by entry parsed as a map — write it as checkout:BET-012`
