## ADDED Requirements

### Requirement: oprim-bet SHALL display a context block defining a bet before prompting for a title
Before showing the naming convention tip and before asking for a title, the `oprim-bet` skill SHALL display a brief context block (1–2 sentences) that defines what a bet is in functional, plain-language terms. The context block SHALL describe what the user is about to capture so they can act without prior knowledge of product methodology.

#### Scenario: Context block shown before any prompt
- **WHEN** the user invokes the `oprim-bet` skill
- **THEN** the first output is a context block defining what a bet is, before the naming tip and before any input prompt

#### Scenario: Context block uses plain language
- **WHEN** the context block is rendered
- **THEN** it does not require familiarity with Shape Up, PDRs, or structured product methodology to understand — a developer reading it for the first time can proceed confidently

#### Scenario: Context block precedes existing naming convention tip
- **WHEN** the user invokes the `oprim-bet` skill
- **THEN** the context block appears before the naming convention tip (not after), so concept precedes convention
