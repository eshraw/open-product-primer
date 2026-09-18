## MODIFIED Requirements

### Requirement: The interceptor SHALL run checkSpecDeltaDrift() inline on spec-delta writes
When `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` is enabled and a bet's `specs/<capability>/spec.md` delta file is written during a session, the interceptor SHALL invoke `checkSpecDeltaDrift()` (`lib/validate-checks.ts`) against the write and surface any MODIFIED/REMOVED header mismatch via visible UI (`$.ui.toast` and/or a `$.ui.render` panel), not only as a text block reason, in the same session as the write.

#### Scenario: MODIFIED requirement header drift caught at write time
- **WHEN** a bet's delta is written with a `## MODIFIED Requirements` header that does not match (whitespace-insensitive) any `### Requirement:` header in `oprim/specs/<capability>/spec.md`
- **THEN** the interceptor surfaces the same failing-check message `oprim validate` would produce via a toast and/or `ui.render` panel, at write time rather than at validate/CI time

#### Scenario: REMOVED requirement header drift caught at write time
- **WHEN** a bet's delta is written with a `## REMOVED Requirements` header that has no match in current truth
- **THEN** the interceptor surfaces a failing-check message identifying the bet, capability, and requirement header via visible UI at write time

#### Scenario: No drift, no interruption
- **WHEN** a bet's delta is written and every MODIFIED/REMOVED requirement header matches current truth
- **THEN** the interceptor reports nothing and the write proceeds without interruption, and no UI element is shown

#### Scenario: ADDED requirements are not subject to the interceptor
- **WHEN** a bet's delta is written with a `## ADDED Requirements` header not present in current truth
- **THEN** the interceptor does not flag it, matching `checkSpecDeltaDrift()`'s existing ADDED exemption
