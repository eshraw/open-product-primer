## MODIFIED Requirements

### Requirement: README SHALL lead with value framing before structure
The README's opening section SHALL communicate what oprim does for the developer in concrete, plain-language terms before introducing workspace structure, file layout, or product methodology terminology. A developer without prior exposure to Shape Up or structured product decision-making SHALL be able to understand the tool's purpose from the first paragraph alone.

#### Scenario: Methodology-naive developer reads the README opening
- **WHEN** a developer unfamiliar with Shape Up or product methodology reads the README from the top
- **THEN** they can answer "what does this tool do for me right now" before encountering any terminology (bet, PDR, primer, sequencing)

#### Scenario: README opening does not lead with structure or file layout
- **WHEN** the README is rendered
- **THEN** the first visible section does not begin with a directory tree, file listing, or workspace schema

### Requirement: README SHALL frame a bet using a concrete example before defining it abstractly
The README SHALL introduce the concept of a bet using a relatable, concrete scenario (e.g., "you're about to decide whether to rebuild the auth system") before offering a formal definition. The example SHALL precede the definition, not follow it.

#### Scenario: Bet concept introduced via example
- **WHEN** a developer reads the section describing what a bet is
- **THEN** they encounter a concrete scenario illustrating the concept before reading a definition or structural description

## ADDED Requirements

### Requirement: README SHALL use the correct package name in all install commands
Every install command in the README SHALL reference `@open-product-primer/cli` (not `@open-product-oprim/cli`). No variant of the package name appearing in the README SHALL contain a typo.

#### Scenario: Developer copies the install command
- **WHEN** a developer copies the npm install command from the README
- **THEN** the command installs the correct package without a 404 or "package not found" error

### Requirement: README SHALL use `oprim` as the primary command alias
All CLI usage examples in the README SHALL use `oprim` as the canonical command. The long-form alias `open-product-primer` MAY be mentioned once in the npm package section as a secondary alias but SHALL NOT appear in quickstart or usage examples.

#### Scenario: Developer follows the quickstart
- **WHEN** a developer follows the README quickstart step by step
- **THEN** every command they run uses the `oprim` alias and succeeds without alias-not-found errors
