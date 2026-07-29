## ADDED Requirements

### Requirement: task-management SHALL let a user add a task
The system SHALL let a user add a new task to their list by providing a title. A task with an empty title SHALL be rejected.

#### Scenario: Add a task with a title
- **GIVEN** an empty task list
- **WHEN** the user adds a task titled "Buy milk"
- **THEN** the list contains one task titled "Buy milk" with `completed: false`

#### Scenario: Reject an empty title
- **WHEN** the user attempts to add a task with an empty title
- **THEN** the task is not added and the list is unchanged

### Requirement: task-management SHALL let a user mark a task complete
The system SHALL let a user toggle a task's completed state.

#### Scenario: Complete a task
- **GIVEN** a task titled "Buy milk" with `completed: false`
- **WHEN** the user marks it complete
- **THEN** the task's `completed` field is `true`

### Requirement: task-management SHALL let a user delete a task
The system SHALL let a user remove a task from their list.

#### Scenario: Delete a task
- **GIVEN** a task titled "Buy milk"
- **WHEN** the user deletes it
- **THEN** the task no longer appears in the list
