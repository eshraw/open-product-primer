## ADDED Requirements

### Requirement: A bet SHALL support an optional discovery.md artifact
Each bet directory MAY contain a `discovery.md` file co-located with `bet-decision.md`. When present, it SHALL follow the structured template covering problem framing, user research signals, competitive context, and open questions.

#### Scenario: Discovery file present in a bet directory
- **WHEN** `primer/bets/BET-NNN/discovery.md` exists
- **THEN** the file is treated as the discovery record for that bet and is accessible alongside the decision record

#### Scenario: Discovery file absent from a bet directory
- **WHEN** `primer/bets/BET-NNN/discovery.md` does not exist
- **THEN** no error or failure occurs — discovery is optional

### Requirement: oprim init SHALL write a discovery.md template to primer/templates/
The system SHALL write a `discovery.md` starter template to `primer/templates/discovery.md` during `oprim init`, enabling teams to customize the structure.

#### Scenario: Init writes discovery template
- **WHEN** a user runs `oprim init`
- **THEN** `primer/templates/discovery.md` is written (or refreshed) with the default discovery template structure

### Requirement: oprim doctor SHALL warn when a bet is missing discovery.md
For each directory under `primer/bets/` that contains a `bet-decision.md`, `oprim doctor` SHALL report a non-blocking warning if `discovery.md` is absent.

#### Scenario: Doctor warns on missing discovery file
- **WHEN** `primer/bets/BET-NNN/bet-decision.md` exists and `primer/bets/BET-NNN/discovery.md` does not
- **THEN** `oprim doctor` reports a warning (yellow `○`) for that bet: "discovery.md missing — consider adding discovery context"
- **AND** the overall health check still passes if no required checks fail

#### Scenario: Doctor passes when discovery file is present
- **WHEN** `primer/bets/BET-NNN/discovery.md` exists
- **THEN** `oprim doctor` reports a pass for that bet's discovery check
