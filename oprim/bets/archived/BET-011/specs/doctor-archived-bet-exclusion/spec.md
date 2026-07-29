## ADDED Requirements

### Requirement: Doctor skips archived bets in discovery check
Doctor SHALL exclude all entries under `oprim/bets/archived/` when checking for `discovery.md`, so archived bets produce no discovery health-check output.

#### Scenario: Archived bet is not flagged for missing discovery.md
- **WHEN** `oprim doctor` runs and `oprim/bets/archived/BET-002/bet-decision.md` exists but `oprim/bets/archived/BET-002/discovery.md` does not
- **THEN** no discovery check for `BET-002` appears in the doctor output

#### Scenario: Active bet is still checked for discovery.md
- **WHEN** `oprim doctor` runs and `oprim/bets/BET-005/bet-decision.md` exists but `oprim/bets/BET-005/discovery.md` does not
- **THEN** doctor outputs a warning for `discovery: BET-005/discovery.md`

### Requirement: Criteria scanner uses oprim/bets/ and excludes archived
`scanCriteriaForSourceType` SHALL read from `oprim/bets/` (not `primer/bets/`) and SHALL skip the `archived/` entry, so archived bets do not affect credential requirement detection.

#### Scenario: Active bet with amplitude criteria triggers credential check
- **WHEN** `oprim/bets/BET-007/criteria.yaml` contains a metric with `source.type: amplitude`
- **THEN** `scanCriteriaForSourceType(root, 'amplitude')` returns `true` and doctor warns if `AMPLITUDE_API_KEY` is unset

#### Scenario: Archived bet with amplitude criteria does not trigger credential check
- **WHEN** `oprim/bets/archived/BET-002/criteria.yaml` contains a metric with `source.type: amplitude`
- **THEN** `scanCriteriaForSourceType(root, 'amplitude')` returns `false` (assuming no active bet has amplitude metrics)

#### Scenario: No active bets have bigquery criteria
- **WHEN** no `criteria.yaml` in `oprim/bets/BET-XXX/` contains a bigquery metric
- **THEN** `scanCriteriaForSourceType(root, 'bigquery')` returns `false` and doctor notes `GOOGLE_APPLICATION_CREDENTIALS` is not required
