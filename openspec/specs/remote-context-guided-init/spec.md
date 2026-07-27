## Requirements

### Requirement: An oprim-context-init skill SHALL guide the user through drafting a description before initializing a remote context
The system SHALL provide an `oprim-context-init` Claude Code skill (invoked as `/oprim:context-init`), following the same conversational-guidance pattern as the existing `oprim-bet` and `oprim-pdr` skills, that asks the user a short set of questions about what their oprim workspace covers (e.g. audience, capabilities, kinds of content), drafts a `description` from their answers, and then invokes `oprim context init --description "<drafted text>"` on the user's behalf — so a remote context is not left without a description understandable by humans and agents alike.

#### Scenario: Guided drafting produces a description
- **WHEN** a user invokes `/oprim:context-init` in a project with no existing `.oprim-context/context.yaml`
- **THEN** the skill asks the user about the workspace's content/audience, drafts a description from the answers, and calls `oprim context init --description "<drafted text>"`

#### Scenario: User edits the drafted description before it is used
- **WHEN** the skill presents a drafted description to the user
- **THEN** the user can revise the text before the skill calls `oprim context init` with the final version

#### Scenario: Remote context identity already exists
- **WHEN** a user invokes `/oprim:context-init` in a project that already has `.oprim-context/context.yaml`
- **THEN** the skill reports that a remote context identity already exists and does not re-run the guided drafting flow

### Requirement: The guided skill SHALL allow the user to opt out of drafting, with a clear warning
The system SHALL allow a user to explicitly decline the guided drafting flow (e.g. to init without a description), but SHALL warn that the resulting remote context will have no description, making it harder for other users or agents to know what it contains via `oprim context list`.

#### Scenario: User opts out of guided drafting
- **WHEN** a user invoking `/oprim:context-init` explicitly declines to answer the drafting questions
- **THEN** the skill calls `oprim context init` without `--description`, after warning the user that the resulting context will show as having no description in `oprim context list`
