## ADDED Requirements

### Requirement: Current-truth specs SHALL use an optional preamble followed by a single flat Requirements section
A file at `oprim/specs/<capability>/spec.md` SHALL consist of optional preamble lines (e.g. `# <capability> Specification`, `## Purpose`) followed by exactly one `## Requirements` section holding every `### Requirement:` block. Delta headings (`## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`) are the *legacy* format when they appear in a current-truth file.

#### Scenario: Canonical file
- **GIVEN** `oprim/specs/note-authoring/spec.md` with a title, a `## Purpose` section and a `## Requirements` section
- **WHEN** `oprim doctor` runs
- **THEN** no spec-format warning is shown for `note-authoring`

#### Scenario: Legacy file detected
- **GIVEN** `oprim/specs/bet-archiving/spec.md` whose requirements sit under `## ADDED Requirements`
- **WHEN** `oprim doctor` runs
- **THEN** it shows a non-required warning `spec: bet-archiving uses legacy delta headings — run 'oprim migrate --specs'`

### Requirement: Reading current truth SHALL find requirements in both canonical and legacy files
`parseCurrentTruthHeaders()` and the current-truth side of `foldDelta()` SHALL collect every `### Requirement:` block under `## Requirements`, and, for a legacy file, under `## ADDED Requirements` and `## MODIFIED Requirements`, in file order. Blocks under a legacy `## REMOVED Requirements` section SHALL NOT be treated as current requirements.

#### Scenario: MODIFIED delta against a legacy file
- **GIVEN** a legacy current-truth `doctor-sequence-integrity` with 3 requirements under `## ADDED Requirements`
- **AND** an active bet with a MODIFIED delta for `Doctor warns on dangling blocked_by references`
- **WHEN** `oprim validate` runs
- **THEN** no `spec-delta: … no longer matches current truth` failure is reported

### Requirement: Folding a delta SHALL never drop existing requirements or preamble
`foldDelta()` SHALL return every current-truth requirement not explicitly MODIFIED or REMOVED by the delta, in its original order, followed by ADDED blocks. It SHALL keep every preamble line above the requirements section byte-for-byte, and SHALL always write the result in the canonical format.

#### Scenario: ADDED-only delta into a legacy file
- **GIVEN** legacy `workflow-schema-authoring` with 3 requirements
- **AND** BET-075's delta adding 2 requirements
- **WHEN** `oprim validate --diff BET-075` previews the fold
- **THEN** the preview for `workflow-schema-authoring` contains 5 requirements under one `## Requirements` header

#### Scenario: Preamble kept
- **GIVEN** `note-authoring` starting with `# note-authoring Specification` and a `## Purpose` section
- **WHEN** any delta is folded into it
- **THEN** the result starts with the same title and Purpose lines, followed by `## Requirements`

### Requirement: Folding SHALL refuse when current truth has requirements it could not parse
If the current-truth file contains at least one line matching `^### Requirement:` but the parser collects fewer blocks than there are such lines, `foldDelta()` SHALL throw an error naming the file and both counts, and `/oprim:archive` SHALL stop without writing current truth or moving the bet.

#### Scenario: Unknown section heading
- **GIVEN** a current-truth file with 4 `### Requirement:` lines, 2 of them under an unrecognised `## Requirements (deprecated)` heading
- **WHEN** a delta is folded into it
- **THEN** the fold throws `cannot fold into oprim/specs/<capability>/spec.md: found 4 requirement headers but parsed 2`
- **AND** the file is unchanged
