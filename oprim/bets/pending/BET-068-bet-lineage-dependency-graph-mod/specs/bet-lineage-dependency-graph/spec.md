## ADDED Requirements

### Requirement: bet-lineage-dependency-graph SHALL render a bet's PDR-to-archive chain as a graph
Given a bet ID, the command SHALL resolve its linked PDRs, `criteria.yaml`, and `specs/<capability>/spec.md` deltas, and render them as a Mermaid `graph TD` diagram showing the PDR → bet → criteria → spec-delta chain.

#### Scenario: Bet with a full lineage
- **GIVEN** a bet has linked PDRs, a `criteria.yaml`, and one or more spec deltas
- **WHEN** the lineage-graph command is invoked with that bet's ID
- **THEN** it outputs a Mermaid diagram with nodes for the PDR(s), the bet, the criteria contract, and each spec delta, connected in chain order

### Requirement: bet-lineage-dependency-graph SHALL render partial lineage without error
#### Scenario: Bet missing some lineage links
- **GIVEN** a bet has no linked PDRs and no `criteria.yaml`
- **WHEN** the lineage-graph command is invoked with that bet's ID
- **THEN** it renders the partial chain (bet plus whatever links exist) rather than erroring on the missing links

### Requirement: bet-lineage-dependency-graph SHALL indicate archive status on the bet node
#### Scenario: Archived vs. pending bet
- **WHEN** the lineage graph is rendered for a bet
- **THEN** the bet's node visually indicates whether it is in `oprim/bets/pending/` or `oprim/bets/archived/`
