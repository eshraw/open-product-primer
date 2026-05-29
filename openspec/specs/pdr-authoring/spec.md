## Requirements

### Requirement: The system SHALL provide the oprim-pdr skill to create new Product Decision Records
The system SHALL provide the `oprim-pdr` skill that guides the user through creating a new PDR, auto-assigns the next sequential PDR-NNN ID by scanning `primer/decisions/`, and writes the populated artifact to `primer/decisions/PDR-NNN-<slug>.md`.

#### Scenario: Create a new PDR with auto-assigned ID
- **WHEN** a user invokes the `oprim-pdr` skill with a decision title or description
- **THEN** the skill scans `primer/decisions/` for the highest existing PDR number, assigns next = max + 1, and creates `primer/decisions/PDR-NNN-<slug>.md` with status "Proposed"

#### Scenario: Create first PDR in an empty decisions directory
- **WHEN** `primer/decisions/` exists but contains no PDR files
- **THEN** the skill assigns PDR-001 and creates the file

### Requirement: oprim-pdr SHALL populate all required PDR sections
The skill SHALL write a complete PDR including status, context, decision statement, alternatives considered, consequences, evidence links, and related artifact references.

#### Scenario: Populate PDR from user-provided context
- **WHEN** the user provides a title, the decision context, and the decision statement
- **THEN** the resulting file contains all PDR sections with the provided content and placeholder text for optional sections not yet known

### Requirement: oprim-pdr SHALL support supersession linking
The skill SHALL accept an optional existing PDR ID to supersede, and SHALL update both the new PDR's `Supersedes` field and the superseded PDR's `Status` to reflect the relationship.

#### Scenario: Create a superseding PDR
- **WHEN** the user invokes the `oprim-pdr` skill and specifies an existing PDR ID to supersede
- **THEN** the new PDR has `Supersedes: PDR-NNN` in its Related section AND the superseded PDR's Status line is updated to `Superseded by PDR-MMM`
