## Requirements

### Requirement: oprim init SHALL prompt the user to opt in to proactive PDR surfacing
The `oprim init` command SHALL present an opt-in prompt for proactive PDR surfacing during setup. The feature SHALL be disabled by default — the user must explicitly choose to enable it.

#### Scenario: User opts in during init
- **WHEN** the user runs `oprim init` and answers "y" to the PDR surfacing opt-in prompt
- **THEN** the `oprim:context` skill is installed and all oprim and openspec skills are installed with an `oprim:context` invocation as their first step

#### Scenario: User declines during init
- **WHEN** the user runs `oprim init` and answers "n" (or presses Enter) at the PDR surfacing opt-in prompt
- **THEN** the `oprim:context` skill is NOT installed and all oprim and openspec skills are installed exactly as they are today, with no behavior change

### Requirement: oprim update SHALL re-prompt the user to opt in to proactive PDR surfacing
The `oprim update` command SHALL present the same opt-in prompt as `oprim init` so users can enable or disable the feature on subsequent runs.

#### Scenario: User enables surfacing on update after previously declining
- **WHEN** the user runs `oprim update` and answers "y" to the PDR surfacing opt-in prompt (having previously declined)
- **THEN** the `oprim:context` skill is installed and all oprim and openspec skills are reinstalled with the `oprim:context` invocation step

#### Scenario: User disables surfacing on update after previously enabling
- **WHEN** the user runs `oprim update` and answers "n" (or presses Enter) at the PDR surfacing opt-in prompt (having previously opted in)
- **THEN** the `oprim:context` skill is removed and all oprim and openspec skills are reinstalled without the `oprim:context` invocation step

### Requirement: The system SHALL provide an oprim:context skill that surfaces relevant PDRs
The system SHALL provide an `oprim:context` skill that scans `oprim/decisions/`, extracts topic keywords from the current conversation, and surfaces any PDRs whose filenames, titles, or body content overlap with those keywords. If `oprim/decisions/` is empty or no PDRs match, the skill SHALL exit silently. This skill is only installed when the user has opted in.

#### Scenario: Relevant PDRs surfaced at skill start
- **WHEN** a user invokes any oprim or openspec skill, PDR surfacing is opted in, and `oprim/decisions/` contains one or more PDR files whose content matches keywords from the active conversation
- **THEN** the skill displays a compact inline list of matching PDRs (filename + title + status) before the invoked skill proceeds

#### Scenario: Silent exit when decisions directory is empty
- **WHEN** a user invokes any oprim or openspec skill with PDR surfacing opted in and `oprim/decisions/` is empty
- **THEN** the `oprim:context` invocation produces no output and the invoked skill proceeds normally

#### Scenario: Silent exit when no PDRs match conversation keywords
- **WHEN** a user invokes any oprim or openspec skill with PDR surfacing opted in and `oprim/decisions/` contains PDR files but none match the keyword topics extracted from the conversation
- **THEN** the `oprim:context` invocation produces no output and the invoked skill proceeds normally

### Requirement: When opted in, all oprim skills SHALL invoke oprim:context as their first step
Each oprim skill (`oprim-bet`, `oprim-pdr`, `oprim-review`, `oprim-criteria`, `oprim-archive`) SHALL invoke `oprim:context` before executing its own steps when the feature is opted in, so that relevant product decisions are visible to the user at the moment they begin work.

#### Scenario: oprim-bet surfaces decisions before bet creation when opted in
- **WHEN** a user invokes the `oprim-bet` skill and PDR surfacing is opted in
- **THEN** `oprim:context` runs first and any matching PDRs are displayed before the bet title prompt appears

#### Scenario: oprim-bet proceeds normally when not opted in
- **WHEN** a user invokes the `oprim-bet` skill and PDR surfacing is NOT opted in
- **THEN** the skill begins at its first step with no `oprim:context` invocation and no change to existing behavior

### Requirement: When opted in, all openspec skills SHALL invoke oprim:context as their first step
Each openspec skill (`openspec-propose`, `openspec-apply-change`, `openspec-explore`, `openspec-archive-change`) SHALL invoke `oprim:context` before executing its own steps when the feature is opted in, so that relevant product decisions are visible when working on implementation artifacts.

#### Scenario: openspec-propose surfaces decisions before proposal authoring when opted in
- **WHEN** a user invokes the `openspec-propose` skill and PDR surfacing is opted in
- **THEN** `oprim:context` runs first and any matching PDRs are displayed before the proposal questions begin

#### Scenario: openspec-propose proceeds normally when not opted in
- **WHEN** a user invokes the `openspec-propose` skill and PDR surfacing is NOT opted in
- **THEN** the skill begins at its first step with no `oprim:context` invocation and no change to existing behavior

### Requirement: oprim:context SHALL use keyword matching to determine relevance
The skill SHALL extract topic keywords from the active conversation (e.g., current bet IDs, capability names, file paths mentioned, subject-area nouns) and compare them against PDR content. A PDR is considered relevant if one or more keywords appear in its filename, title, or body.

#### Scenario: PDR matched by bet ID keyword
- **WHEN** the conversation references BET-007 and a PDR file contains "BET-007" in its body or related section
- **THEN** that PDR is included in the surfaced list

#### Scenario: PDR matched by topic keyword
- **WHEN** the conversation is about "decisions surfacing" and a PDR title or body contains the word "decisions" or "surfacing"
- **THEN** that PDR is included in the surfaced list
