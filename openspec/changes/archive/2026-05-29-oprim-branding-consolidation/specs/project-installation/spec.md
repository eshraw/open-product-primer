## MODIFIED Requirements

### Requirement: oprim CLI help output SHALL identify the program as `oprim`
The CLI program name shown in `--help` output SHALL be `oprim`. The description SHALL lead with `oprim`, not "Open Product Primer".

#### Scenario: User runs oprim --help
- **WHEN** a user runs `oprim --help`
- **THEN** the help output identifies the program as `oprim`
- **AND** the description reads `oprim — product decisions, sequencing, and KPI tracking`
- **AND** "Open Product Primer" does not appear in the output

### Requirement: oprim init SHALL display `oprim` in its banner and command description
The `oprim init` command description (shown in `--help`) and the console banner printed during initialization SHALL use `oprim`, not "Open Product Primer".

#### Scenario: User runs oprim init --help
- **WHEN** a user runs `oprim init --help`
- **THEN** the command description reads `Initialize oprim in the current repository`
- **AND** "Open Product Primer" does not appear

#### Scenario: User runs oprim init
- **WHEN** a user runs `oprim init`
- **THEN** the opening banner reads `oprim — initializing project workspace...`
- **AND** "Open Product Primer" does not appear in the banner

### Requirement: oprim doctor SHALL display `oprim` in its banner and command description
The `oprim doctor` command description and the console banner printed during health check SHALL use `oprim`, not "Open Product Primer".

#### Scenario: User runs oprim doctor --help
- **WHEN** a user runs `oprim doctor --help`
- **THEN** the command description reads `Check oprim install health and integration readiness`
- **AND** "Open Product Primer" does not appear

#### Scenario: User runs oprim doctor
- **WHEN** a user runs `oprim doctor`
- **THEN** the opening banner reads `oprim — health check`
- **AND** "Open Product Primer" does not appear in the banner

### Requirement: oprim init SHALL generate a README template that leads with `oprim`
The README template written by `oprim init` to the project SHALL use `oprim` as the heading and leading identifier, not "Open Product Primer".

#### Scenario: oprim init generates README template
- **WHEN** a user runs `oprim init` in a repository
- **THEN** the generated README begins with `# oprim` as the top-level heading
- **AND** the introductory sentence identifies the tool as `oprim`, not "Open Product Primer"
