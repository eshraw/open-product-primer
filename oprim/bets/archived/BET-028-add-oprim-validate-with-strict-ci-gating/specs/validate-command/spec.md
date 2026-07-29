## ADDED Requirements

### Requirement: oprim SHALL provide a standalone validate command with a CI-appropriate exit code
The system SHALL provide `oprim validate`, which aggregates sequence-integrity checks, skill-version-drift checks, and this bet's new bet/spec checks (`bet-definition-of-done`, `spec-delta-drift-detection`, `cross-bet-conflict-detection`) into a single report, and SHALL exit with a non-zero status code if any check marked `required` fails.

#### Scenario: Validate passes
- **WHEN** `oprim validate` runs in a project with no required check failures
- **THEN** the command prints a passing summary and exits with status code 0

#### Scenario: Validate fails on a required check
- **WHEN** `oprim validate` runs and at least one required check fails (e.g. a dangling `blocked_by` reference is treated as required)
- **THEN** the command prints the failing check and exits with a non-zero status code

### Requirement: validate SHALL support machine-readable JSON output
The system SHALL support `oprim validate --json`, which SHALL print a single JSON object to stdout containing the full list of checks (name, pass, required, note) and does not print the human-readable report.

#### Scenario: JSON output shape
- **WHEN** `oprim validate --json` runs
- **THEN** stdout is a single valid JSON document with a `checks` array (each entry having `name`, `pass`, `required`, and optional `note` fields) and no other human-readable text

### Requirement: validate SHALL support a strict mode that fails on any check, not only required ones
The system SHALL support `oprim validate --strict`, under which the command exits with a non-zero status code if **any** check fails, including checks marked `required: false` (e.g. skill-version drift, WIP limit warnings).

#### Scenario: Strict mode fails on a non-required warning
- **WHEN** `oprim validate --strict` runs and a non-required check (e.g. `agent: Claude skill oprim-bet is out of date`) fails, with all required checks passing
- **THEN** the command exits with a non-zero status code

#### Scenario: Non-strict mode tolerates the same warning
- **WHEN** `oprim validate` (without `--strict`) runs under the same conditions as the previous scenario
- **THEN** the command exits with status code 0, printing the warning as non-blocking
