## ADDED Requirements

### Requirement: oprim SHALL support scaffolding atomic notes in a dedicated directory
The system SHALL provide an `oprim-note` skill that scaffolds a new note as `oprim/notes/NOTE-NNN-<slug>.md`, with `NOTE-NNN` assigned by scanning existing `oprim/notes/NOTE-(\d+)` files for the next zero-padded id, mirroring the existing `BET-NNN` assignment convention.

#### Scenario: Scaffold a new note
- **WHEN** a user invokes the `oprim-note` skill with a note title
- **THEN** a new file `oprim/notes/NOTE-NNN-<slug>.md` is created with the next available zero-padded note id

### Requirement: Every note SHALL carry minimal frontmatter regardless of OKF opt-in
Every scaffolded note SHALL include a YAML frontmatter block with `type: note`, `title`, `tags`, and `timestamp`, independent of the `okf.enabled` flag in `oprim/config.yaml`.

#### Scenario: Note frontmatter present when OKF is disabled
- **WHEN** a user scaffolds a note in a project where `oprim/config.yaml` has `okf.enabled: false` or the field is absent
- **THEN** the note's frontmatter contains `type: note`, `title`, `tags`, and `timestamp`

### Requirement: Notes SHALL gain an improved frontmatter tier when OKF is enabled
When `okf.enabled: true`, a scaffolded note's frontmatter SHALL additionally include a `description` field, matching the field set used by the `bet-decision`/`pdr`/`kpi-review` templates.

#### Scenario: Note frontmatter upgraded when OKF is enabled
- **WHEN** a user scaffolds a note in a project where `oprim/config.yaml` has `okf.enabled: true`
- **THEN** the note's frontmatter contains `type: note`, `title`, `description`, `tags`, and `timestamp`

### Requirement: Note tags SHALL be drawn from a controlled, self-seeding vocabulary
The system SHALL define a `notes.tags` list in `oprim/config.yaml` as the controlled vocabulary for note tags. The `oprim-note` skill SHALL write `notes.tags` to `oprim/config.yaml` lazily — the first time a note is scaffolded, if the key is absent — rather than requiring `oprim update` to pre-populate it. A tag not yet present in `notes.tags` (including when the list is empty or absent) SHALL be accepted and appended to `notes.tags`, so the vocabulary grows from usage instead of blocking note creation.

#### Scenario: First note in a project seeds the vocabulary
- **WHEN** a user scaffolds the first note in a project where `oprim/config.yaml` has no `notes.tags` key
- **THEN** `notes.tags` is created in `oprim/config.yaml` containing the tag(s) used on that note

#### Scenario: A new tag extends the existing vocabulary
- **WHEN** a user scaffolds a note with a tag not yet present in `oprim/config.yaml`'s `notes.tags` list
- **THEN** the note is created with that tag, and the tag is appended to `notes.tags`

### Requirement: Notes SHALL relate to bets by explicit mention, not directory nesting
A note that relates to one or more bets SHALL record that relationship via an explicit `Bets:` reference in the note body (or a corresponding link in the bet-decision's `## Links` section), and SHALL NOT be required to live under a specific bet's directory.

#### Scenario: Note references a bet
- **WHEN** a note is relevant to `BET-XXX`
- **THEN** the note body contains a `Bets: BET-XXX` reference, and the note continues to live in `oprim/notes/`, not nested under `oprim/bets/BET-XXX/`
