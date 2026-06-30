## ADDED Requirements

### Requirement: Doctor warns when installed Claude skills differ from CLI-bundled content
When `.claude/skills/` exists, doctor SHALL compare each installed `oprim-*` skill file against the content the current CLI would write. If the content differs (after stripping any PDR-surfacing Step 0 block from the installed file), doctor SHALL emit a non-required warning check per drifted skill.

#### Scenario: Installed skill is out of date
- **WHEN** `oprim doctor` runs and `.claude/skills/oprim-bet/SKILL.md` exists with content that does not match the CLI's bundled `oprim-bet` skill
- **THEN** doctor outputs a non-required warning: `agent: Claude skill oprim-bet is out of date` with note `Run 'oprim update' to refresh`

#### Scenario: Installed skill matches CLI-bundled content
- **WHEN** `oprim doctor` runs and `.claude/skills/oprim-bet/SKILL.md` content matches the CLI's bundled `oprim-bet` skill
- **THEN** no skill drift warning for `oprim-bet` appears

#### Scenario: PDR-surfacing Step 0 prefix is ignored during comparison
- **WHEN** `oprim doctor` runs and `.claude/skills/oprim-bet/SKILL.md` has a Step 0 PDR-surfacing prefix prepended but the rest of the content matches the CLI's bundled skill
- **THEN** no skill drift warning for `oprim-bet` appears

### Requirement: Doctor skips skill version check when .claude/skills/ is absent
If `.claude/skills/` does not exist, doctor SHALL NOT emit any skill drift warnings.

#### Scenario: No Claude agent installed
- **WHEN** `oprim doctor` runs and `.claude/skills/` does not exist
- **THEN** no skill drift warnings appear in doctor output

### Requirement: Doctor skips skill version check for skills not present in the installed directory
Doctor SHALL only check skills that are already installed. Missing skills are covered by existing agent-environment checks, not by skill-drift checks.

#### Scenario: Skill not yet installed
- **WHEN** `oprim doctor` runs and `.claude/skills/oprim-criteria/` does not exist
- **THEN** no skill drift warning for `oprim-criteria` appears (absence is not flagged here)
