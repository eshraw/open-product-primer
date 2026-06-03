## ADDED Requirements

### Requirement: oprim-bet SHALL display a naming convention before prompting for the title
Before asking the user for a bet title, the skill SHALL display a brief naming convention guide with a good and bad example so the user can write a clear title from the start.

#### Scenario: Naming convention shown before title prompt
- **WHEN** the user invokes the `oprim-bet` skill
- **THEN** the skill displays a naming tip (e.g., "Good: 'Improve bet naming for scannability' / Bad: 'Naming'") before asking for the title

### Requirement: oprim-bet SHALL warn when a bet title is too short to be self-explanatory
The skill SHALL check the provided title and, if it is fewer than 4 words or fewer than 25 characters, show a soft warning with a reformulation suggestion. The user MAY proceed with the original title.

#### Scenario: Short title triggers a soft warning
- **WHEN** the user provides a title with fewer than 4 words or fewer than 25 characters
- **THEN** the skill shows a warning message noting the title may be too vague, suggests a reformulated example, and prompts the user to confirm or revise

#### Scenario: Short title accepted after confirmation
- **WHEN** the user confirms they want to keep a short title after seeing the warning
- **THEN** the skill proceeds with the original title and creates the bet normally

#### Scenario: Title meeting the convention proceeds without warning
- **WHEN** the user provides a title with 4 or more words and 25 or more characters
- **THEN** the skill creates the bet without showing any warning

### Requirement: oprim-bet SHALL include a naming tip in the scaffolded bet-decision.md template
The generated `bet-decision.md` SHALL include an inline comment in the title/header area showing the naming convention so it is visible when the file is first opened.

#### Scenario: Naming tip present in scaffolded file
- **WHEN** a new `bet-decision.md` is created by the `oprim-bet` skill
- **THEN** the file contains a comment or example adjacent to the title field showing the recommended naming format
