## ADDED Requirements

### Requirement: validate SHALL flag a promoted bet that has no criteria contract
For each bet directory under `oprim/bets/` (excluding `archived/`) whose `bet-decision.md` `## Links` section contains an `OpenSpec change:` entry that is not the placeholder value ("to be filled when promoted"), `oprim validate` SHALL check for a `criteria.yaml` file in that bet's directory. If absent, `oprim validate` SHALL emit a check with `required: true` under `--strict`.

#### Scenario: Promoted bet missing criteria.yaml
- **WHEN** `oprim validate --strict` runs and `oprim/bets/BET-030-foo/bet-decision.md` links an OpenSpec change but `oprim/bets/BET-030-foo/criteria.yaml` does not exist
- **THEN** validate reports a failing check named `bet: BET-030 promoted without criteria.yaml` and, under `--strict`, this contributes to a non-zero exit code

#### Scenario: Promoted bet with criteria.yaml
- **WHEN** `oprim validate` runs and a promoted bet's directory contains `criteria.yaml`
- **THEN** no missing-criteria check is reported for that bet

#### Scenario: Un-promoted bet is not checked
- **WHEN** `oprim validate` runs and a bet's `bet-decision.md` `## Links` section still has the placeholder `OpenSpec change: to be filled when promoted`
- **THEN** no missing-criteria check is reported for that bet, regardless of whether `criteria.yaml` exists
