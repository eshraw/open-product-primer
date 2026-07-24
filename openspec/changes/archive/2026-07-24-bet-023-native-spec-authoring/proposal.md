## Context

Originating bet: `BET-023` (`oprim/bets/BET-023-author-native-oprim-specs-in-gherkin/bet-decision.md`)

## Why

oprim's spec authoring today hard-depends on OpenSpec: `promoteContent()` in `install-agent.ts` unconditionally invokes `/opsx:propose`, so any project wanting capability specs must install and run OpenSpec even if it only wants oprim's product-decision layer. BET-023 removes that hard dependency by letting oprim author its own capability specs in a native RFC 2119 (SHALL/SHOULD/MAY) + Gherkin (`#### Scenario` GIVEN/WHEN/THEN) syntax.

## What Changes

- Add a native oprim spec-authoring capability: a command/skill that generates an RFC 2119 requirements + Gherkin scenarios capability spec at `oprim/specs/<capability>/spec.md`, with no OpenSpec installation required
- Add `native` as a third choice (alongside the existing `openspec` / `none`) to the speccing-framework selection already prompted at `oprim init` / `oprim update` (`promptFrameworkSelection()`)
- Persist the selected framework durably in `oprim/config.yaml` (a new key) instead of only in Claude's `.claude/hooks/config.json`, so non-Claude agents and `oprim doctor` can see and validate it
- Parameterize `promoteContent()` (and the `/oprim:promote` skill content it generates) to branch on the selected framework:
  - `openspec` → existing `/opsx:propose` delegation path, unchanged
  - `native` → new path that writes the capability spec directly via the native spec-authoring command, without invoking OpenSpec
  - `none` → continues to skip spec generation entirely, unchanged
- No breaking changes: `openspec` remains the default/existing behavior; `native` is additive and opt-in per the bet's generalist-first design constraint

## Capabilities

### New Capabilities
- `spec-authoring`: native oprim command/skill that generates an RFC 2119 + Gherkin capability spec with no OpenSpec installed, plus the config/init/update plumbing that makes `native` a selectable, durably-persisted speccing framework

### Modified Capabilities
- `openspec-promotion-contract`: the bet → OpenSpec-change promotion path (`/oprim:promote` Step 4) becomes conditional on the selected framework instead of unconditionally invoking `/opsx:propose`

## Impact

- `packages/cli/src/lib/install-agent.ts`: `promptFrameworkSelection()` (add `native` choice), `promoteContent()` (parameterize on framework, add native branch), `hooksConfig()` / `installAgentSkills()` (thread `framework` through to where skill content is generated)
- `packages/cli/src/lib/templates.ts`: `oprim/config.yaml` template gains a persisted framework key (e.g. `integrations.spec_framework`)
- `packages/cli/src/commands/init.ts`, `commands/update.ts`: persist the framework selection to `oprim/config.yaml`, not only to Claude's hooks config
- No changes to the `openspec` delegation path's behavior or output
