## ADDED Requirements

### Requirement: oprim-bet SHALL fill in OKF frontmatter when the workspace has opted in
When `oprim/config.yaml` has `okf.enabled: true`, the `oprim-bet` skill SHALL populate the OKF frontmatter block already present at the top of the scaffolded `bet-decision.md` (per the `oprim/templates/bet-decision.md` template written at `oprim init`), setting `type: bet-decision`, `title` from the bet title, a one-line `description`, `tags` derived from the bet's subject area, and `timestamp` to the creation date.

#### Scenario: Frontmatter populated on bet creation when opted in
- **WHEN** a user invokes the `oprim-bet` skill in a workspace where `oprim/config.yaml` has `okf.enabled: true`
- **THEN** the created `bet-decision.md` has its frontmatter block filled in with `type: bet-decision`, the bet's title, a short description, relevant tags, and the creation timestamp

#### Scenario: No frontmatter handling when not opted in
- **WHEN** a user invokes the `oprim-bet` skill in a workspace where `oprim/config.yaml` has `okf.enabled: false` or the field is absent
- **THEN** the created `bet-decision.md` contains no frontmatter block, matching today's behavior exactly
