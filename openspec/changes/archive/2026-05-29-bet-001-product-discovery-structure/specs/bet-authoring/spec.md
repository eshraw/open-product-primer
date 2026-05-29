## MODIFIED Requirements

### Requirement: /oprim:bet SHALL populate all required bet-decision sections
The command SHALL write a complete bet-decision artifact including status (defaulting to "Build now"), decision date, owner, why-now rationale, alternatives considered, expected outcomes, and kill criteria. After writing `bet-decision.md`, the command SHALL prompt the user to optionally scaffold a `discovery.md` in the same bet directory.

#### Scenario: Populate bet decision from user-provided rationale
- **WHEN** the user provides a bet title, why-now rationale, and expected outcomes
- **THEN** the resulting `bet-decision.md` contains all required sections with user-provided content and placeholder text for sections not yet specified

#### Scenario: User opts in to discovery scaffolding
- **WHEN** the bet decision is written and the user responds "y" to the discovery prompt
- **THEN** `primer/bets/BET-NNN/discovery.md` is created from the discovery template
- **AND** the command reports both files as created

#### Scenario: User skips discovery scaffolding
- **WHEN** the bet decision is written and the user responds "n" or presses Enter at the discovery prompt
- **THEN** only `bet-decision.md` is created
- **AND** no error or warning is shown
