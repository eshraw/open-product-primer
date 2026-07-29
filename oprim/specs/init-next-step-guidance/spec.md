## Requirements

### Requirement: oprim init SHALL output a next-step prompt upon successful completion
After `oprim init` completes successfully, the CLI SHALL output a single next-step line that (a) names the immediate action to take and (b) defines "bet" in plain terms without requiring prior methodology knowledge. The prompt SHALL appear after all other init output.

#### Scenario: Next-step prompt rendered after successful init
- **WHEN** `oprim init` completes without errors
- **THEN** the final output includes a line that tells the user to create their first bet and defines a bet in one sentence

#### Scenario: Next-step prompt uses plain language, not methodology jargon
- **WHEN** the next-step prompt is rendered
- **THEN** it does not assume familiarity with Shape Up, PDRs, or structured product decision-making — a developer reading it cold can understand what to do

#### Scenario: Next-step prompt is not rendered on init failure
- **WHEN** `oprim init` exits with an error
- **THEN** no next-step prompt is shown — only the error output

### Requirement: Next-step prompt SHALL specify the agent skill to run
The next-step output SHALL reference `/oprim:bet` as the skill to invoke in the user's coding agent. oprim is agent-native; the CLI does not provide a `bet` command.

#### Scenario: Agent skill referenced in next-step output
- **WHEN** the next-step prompt is rendered after init
- **THEN** it contains `/oprim:bet` so the user knows exactly what to invoke in their agent without consulting docs
