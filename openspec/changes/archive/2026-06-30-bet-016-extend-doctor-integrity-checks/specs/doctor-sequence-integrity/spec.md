## ADDED Requirements

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
