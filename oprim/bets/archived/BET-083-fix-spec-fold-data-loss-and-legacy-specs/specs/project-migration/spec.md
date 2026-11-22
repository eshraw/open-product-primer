## ADDED Requirements

### Requirement: oprim migrate --specs SHALL rewrite legacy current-truth specs to the canonical format losslessly
`oprim migrate --specs` SHALL scan `oprim/specs/*/spec.md`, and for each legacy file, rewrite it as preamble + one `## Requirements` section containing the same `### Requirement:` blocks in the same order, with block bodies byte-identical. It SHALL write a file only after checking that the requirement count and the normalized content of every block match before and after; on any mismatch it SHALL leave that file untouched and report it. Canonical files SHALL NOT be modified. The existing `primer/` → `oprim/` behaviour of `oprim migrate` without `--specs` SHALL be unchanged.

#### Scenario: Migrate a legacy file
- **GIVEN** legacy `bet-archiving` with 4 requirements under `## ADDED Requirements`
- **WHEN** the user runs `oprim migrate --specs`
- **THEN** `bet-archiving/spec.md` has one `## Requirements` section with the same 4 blocks, bodies unchanged
- **AND** the command reports `migrated bet-archiving (4 requirements)`

#### Scenario: Mixed ADDED and MODIFIED sections
- **GIVEN** legacy `sequence-view-scaffold` with blocks under both `## ADDED Requirements` and `## MODIFIED Requirements`
- **WHEN** the user runs `oprim migrate --specs`
- **THEN** all its blocks appear once under `## Requirements`, in file order
- **AND** a block whose header appears in both sections is kept once, using the MODIFIED version, and is listed in the report

#### Scenario: Idempotent
- **GIVEN** every spec is already canonical
- **WHEN** the user runs `oprim migrate --specs`
- **THEN** no file changes and it reports `0 legacy specs`

#### Scenario: Plain migrate unchanged
- **WHEN** the user runs `oprim migrate` without `--specs` in a repo that already has `oprim/`
- **THEN** it prints `oprim/ already exists — nothing to migrate.` exactly as before
