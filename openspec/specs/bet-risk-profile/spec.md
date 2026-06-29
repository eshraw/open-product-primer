## ADDED Requirements

### Requirement: `bet-decision.md` SHALL include a Door type section
Every `bet-decision.md` created via the `/oprim:bet` skill SHALL include a `## Door type` section with two checkboxes: one for 2-way door and one for 1-way door. Exactly one SHALL be checked before the bet is considered ready for promotion.

#### Scenario: Door type section present in new bet
- **WHEN** a user creates a new bet via `/oprim:bet`
- **THEN** the generated `bet-decision.md` includes a `## Door type` section with both checkboxes unchecked

#### Scenario: 2-way door selected
- **WHEN** a user marks `[x] 2-way door`
- **THEN** `oprim ovw` reads this bet as a reversible, lower-commitment bet

#### Scenario: 1-way door selected
- **WHEN** a user marks `[x] 1-way door`
- **THEN** `oprim ovw` treats this bet as a high-commitment decision subject to door-type sequencing advisory rules

### Requirement: `bet-decision.md` SHALL include a Risk profile section
Every `bet-decision.md` created via the `/oprim:bet` skill SHALL include a `## Risk profile` section with four rated dimensions: value risk, usability risk, feasibility risk, and business viability risk. Each dimension SHALL be rated Low, Medium, or High with a short rationale.

#### Scenario: Risk profile section present in new bet
- **WHEN** a user creates a new bet via `/oprim:bet`
- **THEN** the generated `bet-decision.md` includes a `## Risk profile` section with all four dimensions templated as `[Low / Medium / High] — <rationale>`

#### Scenario: All four risk dimensions are completed
- **WHEN** a user fills in the risk profile before promoting a bet
- **THEN** each dimension has exactly one rating (Low, Medium, or High) and a rationale line

### Requirement: `oprim ovw` SHALL extract door type and risk ratings via structured text matching
The `oprim ovw` command SHALL extract door type and risk ratings from `bet-decision.md` using regex matching against the defined section format. It SHALL NOT require a full markdown parser.

#### Scenario: Extracting door type from bet-decision.md
- **WHEN** `bet-decision.md` contains `[x] 2-way door`
- **THEN** `oprim ovw` identifies the bet as a 2-way door

#### Scenario: Extracting risk ratings from bet-decision.md
- **WHEN** `bet-decision.md` contains `**Value risk**: High`
- **THEN** `oprim ovw` reads the value risk as High for that bet

#### Scenario: Missing or malformed risk fields
- **WHEN** a bet's `bet-decision.md` is absent or does not contain the expected sections
- **THEN** `oprim ovw` displays `[risk: unknown]` for that bet and skips it in risk-based advisory rules — no crash
