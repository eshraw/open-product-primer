## ADDED Requirements

### Requirement: oprim-pdr SHALL fill in OKF frontmatter when the workspace has opted in
When `oprim/config.yaml` has `okf.enabled: true`, the `oprim-pdr` skill SHALL populate the OKF frontmatter block already present at the top of the scaffolded PDR file (per the `oprim/templates/pdr.md` template written at `oprim init`), setting `type: pdr`, `title` from the decision title, a one-line `description`, `tags` derived from the decision's subject area, and `timestamp` to the creation date.

#### Scenario: Frontmatter populated on PDR creation when opted in
- **WHEN** a user invokes the `oprim-pdr` skill in a workspace where `oprim/config.yaml` has `okf.enabled: true`
- **THEN** the created PDR file has its frontmatter block filled in with `type: pdr`, the decision's title, a short description, relevant tags, and the creation timestamp

#### Scenario: No frontmatter handling when not opted in
- **WHEN** a user invokes the `oprim-pdr` skill in a workspace where `oprim/config.yaml` has `okf.enabled: false` or the field is absent
- **THEN** the created PDR file contains no frontmatter block, matching today's behavior exactly
