## Requirements

### Requirement: The interceptor SHALL run checkSpecDeltaDrift() inline on spec-delta writes
When `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is enabled and a bet's `specs/<capability>/spec.md` delta file is written during a session, the interceptor SHALL invoke `checkSpecDeltaDrift()` (`lib/validate-checks.ts`) against the write and surface any MODIFIED/REMOVED header mismatch inline, in the same session as the write.

#### Scenario: MODIFIED requirement header drift caught at write time
- **WHEN** a bet's delta is written with a `## MODIFIED Requirements` header that does not match (whitespace-insensitive) any `### Requirement:` header in `oprim/specs/<capability>/spec.md`
- **THEN** the interceptor surfaces the same failing-check message `oprim validate` would produce, at write time rather than at validate/CI time

#### Scenario: REMOVED requirement header drift caught at write time
- **WHEN** a bet's delta is written with a `## REMOVED Requirements` header that has no match in current truth
- **THEN** the interceptor surfaces a failing-check message identifying the bet, capability, and requirement header at write time

#### Scenario: No drift, no interruption
- **WHEN** a bet's delta is written and every MODIFIED/REMOVED requirement header matches current truth
- **THEN** the interceptor reports nothing and the write proceeds without interruption

#### Scenario: ADDED requirements are not subject to the interceptor
- **WHEN** a bet's delta is written with a `## ADDED Requirements` header not present in current truth
- **THEN** the interceptor does not flag it, matching `checkSpecDeltaDrift()`'s existing ADDED exemption

### Requirement: The interceptor SHALL be inert when its mod is not selected
The interceptor's hook SHALL only run when the `spec-delta-drift-interceptor` mod id is present in `oprim/config.yaml`'s `claude_mods:` list. A project that never selects it via `oprim init` or `oprim claude-mods` SHALL see no behavior change from today.

#### Scenario: Mod not selected, no interception
- **WHEN** `spec-delta-drift-interceptor` is absent from `claude_mods:` and a spec-delta file is written
- **THEN** no inline check runs; drift is still only caught by `oprim validate` as before

### Requirement: The interceptor SHALL degrade gracefully if function hooks are unavailable
If `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not enabled in the running Claude Code session, the interceptor SHALL NOT error or block the write — it SHALL no-op silently, leaving `oprim validate` as the sole detection point for that session.

#### Scenario: Function hooks unavailable in session
- **GIVEN** the interceptor mod is selected in `claude_mods:`
- **WHEN** a spec-delta file is written in a session where `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is not active
- **THEN** the write completes normally with no error and no inline check
