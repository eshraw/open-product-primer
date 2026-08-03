## MODIFIED Requirements

### Requirement: oprim init SHALL prompt the user to opt in to proactive PDR surfacing
The `oprim init` command SHALL present an opt-in prompt for proactive PDR surfacing during setup. The feature SHALL be enabled by default — the user must explicitly decline to keep it off.

#### Scenario: User accepts the default during init
- **WHEN** the user runs `oprim init` and answers "y" (or presses Enter) at the PDR surfacing opt-in prompt
- **THEN** the `oprim:context` skill is installed and all oprim and openspec skills are installed with an `oprim:context` invocation as their first step

#### Scenario: User opts out during init
- **WHEN** the user runs `oprim init` and answers "n" at the PDR surfacing opt-in prompt
- **THEN** the `oprim:context` skill is NOT installed and all oprim and openspec skills are installed exactly as they are today, with no behavior change
