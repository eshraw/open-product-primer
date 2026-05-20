## ADDED Requirements

### Requirement: Product decisions SHALL be stored as durable PDR artifacts
The system SHALL support Product Decision Records (PDRs) as durable artifacts under `roadmap/decisions/` with explicit status, context, decision statement, alternatives, consequences, and related links.

#### Scenario: Create a new product decision record
- **WHEN** a user creates a new PDR for a product policy or strategy decision
- **THEN** the record includes status, context, decision, alternatives, consequences, and related references to bets and OpenSpec changes

### Requirement: Bet prioritization decisions SHALL be stored separately from PDRs
The system SHALL store bet-level prioritization decisions under each bet path and SHALL NOT require duplicating durable product policy decisions in bet artifacts.

#### Scenario: Link a bet to existing product decisions
- **WHEN** a user writes or updates `roadmap/bets/BET-XXX/bet-decision.md`
- **THEN** the bet decision links to one or more PDR IDs instead of restating full policy decisions

### Requirement: Decision artifacts SHALL support lifecycle updates
The system SHALL support updating decision status and supersession metadata so teams can track accepted, deprecated, and superseded decisions over time.

#### Scenario: Supersede an existing product decision
- **WHEN** a new PDR supersedes a prior PDR
- **THEN** both records indicate the supersession relationship
