## ADDED Requirements

### Requirement: on-prompt-submit.sh SHALL detect /oprim:bet and write a sequence nudge flag
When `/oprim:bet` is detected in the submitted prompt, `on-prompt-submit.sh` SHALL write a `.sequence-nudge` flag file with context `"bet-created"` to signal that the board may need updating.

#### Scenario: Bet creation triggers flag write
- **WHEN** the user submits a prompt containing `/oprim:bet`
- **THEN** a `.sequence-nudge` file is written with the content `"bet-created"`

### Requirement: on-prompt-submit.sh SHALL detect /oprim:promote and write a sequence nudge flag
When `/oprim:promote` is detected in the submitted prompt, `on-prompt-submit.sh` SHALL write a `.sequence-nudge` flag file with context `"bet-promoted"` to signal that the board may need updating.

#### Scenario: Bet promotion triggers flag write
- **WHEN** the user submits a prompt containing `/oprim:promote`
- **THEN** a `.sequence-nudge` file is written with the content `"bet-promoted"`

### Requirement: on-stop.sh SHALL read .sequence-nudge and surface a non-blocking nudge
When a `.sequence-nudge` flag file exists at session stop, `on-stop.sh` SHALL read the context, output a contextual message suggesting the user run the `oprim-sequence` skill, and delete the flag file.

#### Scenario: Nudge appears after bet creation
- **WHEN** a session stops and `.sequence-nudge` contains `"bet-created"`
- **THEN** `on-stop.sh` outputs a message: a new bet landed in backlog and the user may want to sequence it

#### Scenario: Nudge appears after bet promotion
- **WHEN** a session stops and `.sequence-nudge` contains `"bet-promoted"`
- **THEN** `on-stop.sh` outputs a message: a bet was promoted and the sequencing board may need updating

#### Scenario: Flag is deleted after nudge surfaces
- **WHEN** `on-stop.sh` reads and surfaces a `.sequence-nudge` nudge
- **THEN** the `.sequence-nudge` file is deleted so the nudge does not repeat in the next session

### Requirement: Sequencing nudges SHALL be non-blocking
Sequencing nudges at session stop SHALL be informational only. They SHALL NOT block the session from stopping or require a response before the session ends.

#### Scenario: Nudge does not block session stop
- **WHEN** `on-stop.sh` surfaces a sequencing nudge
- **THEN** the session stops normally regardless of whether the user acts on the nudge

### Requirement: on-stop.sh SHALL also check for open Now slot after bet archival
After the existing archive co-archival prompt resolves, `on-stop.sh` SHALL check whether the Now lane has an open slot and, if so, surface a sequencing nudge suggesting the user pull something from Next.

#### Scenario: Open Now slot nudge after archival
- **WHEN** a bet has just been archived and the Now lane is below WIP limit
- **THEN** `on-stop.sh` outputs a message noting the open slot and suggesting the `oprim-sequence` skill
