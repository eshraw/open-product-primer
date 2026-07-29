## ADDED Requirements

### Requirement: oprim-pdr SHALL invoke oprim:context before guiding PDR creation
The `oprim-pdr` skill SHALL invoke `oprim:context` as its first step so that existing, potentially superseded or related decisions are visible to the user before they begin authoring a new one. This prevents duplicate decisions and helps the author set the right supersession links.

#### Scenario: Related decisions surfaced before new PDR authoring begins
- **WHEN** a user invokes the `oprim-pdr` skill to create a new product decision
- **THEN** `oprim:context` runs first and any PDRs matching the topic keywords are displayed before the title prompt, giving the author the opportunity to check for supersession candidates
