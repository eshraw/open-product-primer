## ADDED Requirements

### Requirement: oprim-review SHALL fill in OKF frontmatter when the workspace has opted in
When `oprim/config.yaml` has `okf.enabled: true`, the `oprim-review` skill SHALL populate the OKF frontmatter block already present at the top of the scaffolded KPI review file (per the `oprim/templates/kpi-review.md` template written at `oprim init`), setting `type: kpi-review`, `title` derived from the bet ID and title, a one-line `description`, `tags` derived from the reviewed bet's subject area, and `timestamp` to the review date.

#### Scenario: Frontmatter populated on review creation when opted in
- **WHEN** a user invokes the `oprim-review` skill in a workspace where `oprim/config.yaml` has `okf.enabled: true`
- **THEN** the created review file has its frontmatter block filled in with `type: kpi-review`, a title referencing the bet, a short description, relevant tags, and the review timestamp

#### Scenario: No frontmatter handling when not opted in
- **WHEN** a user invokes the `oprim-review` skill in a workspace where `oprim/config.yaml` has `okf.enabled: false` or the field is absent
- **THEN** the created review file contains no frontmatter block, matching today's behavior exactly
