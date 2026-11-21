## Requirements

### Requirement: Doctor warns when now-lane exceeds WIP limit
Doctor SHALL parse `oprim/sequence.yaml` and compare the count of entries in the `now:` list against `wip_limits.now`. If the count exceeds the limit, doctor SHALL emit a non-required warning check.

#### Scenario: WIP limit violated
- **WHEN** `oprim doctor` runs and `sequence.yaml` has `wip_limits.now: 2` and the `now:` list contains 3 entries
- **THEN** doctor outputs a non-required warning: `sequence: WIP limit exceeded (3 active, limit 2)`

#### Scenario: WIP limit not exceeded
- **WHEN** `oprim doctor` runs and `sequence.yaml` has `wip_limits.now: 2` and the `now:` list contains 1 entry
- **THEN** no WIP limit warning appears in doctor output

#### Scenario: now lane is empty
- **WHEN** `oprim doctor` runs and `sequence.yaml` has `now: []`
- **THEN** no WIP limit warning appears in doctor output

### Requirement: Doctor warns on dangling blocked_by references
Doctor SHALL collect all bet IDs across all lanes (now, next, later, backlog) and check that every `blocked_by` entry references a known ID. Unknown IDs SHALL produce a non-required warning check.

#### Scenario: blocked_by references a non-existent bet
- **WHEN** `oprim doctor` runs and a bet in `next:` has `blocked_by: [BET-999]` and `BET-999` does not appear in any lane
- **THEN** doctor outputs a non-required warning: `sequence: dangling blocked_by reference BET-999`

#### Scenario: blocked_by references a valid bet
- **WHEN** `oprim doctor` runs and a bet has `blocked_by: [BET-005]` and `BET-005` appears in the `later:` lane
- **THEN** no dangling-reference warning for that entry

#### Scenario: no blocked_by entries in sequence
- **WHEN** `oprim doctor` runs and all sequence entries have `blocked_by: []`
- **THEN** no dangling blocked_by warnings appear

### Requirement: Doctor warns on dangling unlocks references
Doctor SHALL check that every `unlocks` entry references a known bet ID in the sequence. Unknown IDs SHALL produce a non-required warning check.

#### Scenario: unlocks references a non-existent bet
- **WHEN** `oprim doctor` runs and a bet has `unlocks: [BET-888]` and `BET-888` does not appear in any lane
- **THEN** doctor outputs a non-required warning: `sequence: dangling unlocks reference BET-888`

#### Scenario: sequence.yaml is malformed YAML
- **WHEN** `oprim doctor` runs and `sequence.yaml` contains invalid YAML syntax
- **THEN** doctor outputs a single non-required warning: `sequence: could not parse sequence.yaml` and skips all integrity checks

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
