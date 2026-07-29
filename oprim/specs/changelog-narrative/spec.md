## Requirements

### Requirement: CHANGELOG SHALL carry a human-written narrative arc above auto-generated entries
`packages/cli/CHANGELOG.md` SHALL contain a manually authored section that summarises the 0.x development arc in plain language. This section SHALL appear above all auto-generated version entries and SHALL survive future release-please runs.

#### Scenario: Developer reads CHANGELOG before installing 1.0.0
- **WHEN** a developer opens `CHANGELOG.md` to understand what changed before 1.0.0
- **THEN** they find a narrative summary covering the major themes of 0.x development before reaching individual version entries

#### Scenario: release-please adds a new version entry
- **WHEN** release-please prepends a new `## [x.x.x]` entry to the CHANGELOG
- **THEN** the narrative block remains intact and above the auto-generated section
