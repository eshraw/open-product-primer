## 1. Config schema

- [x] 1.1 Add `integrations.spec_framework` (`openspec` | `native` | `none`) to the `oprim/config.yaml` template in `lib/templates.ts`
- [x] 1.2 Update `oprim init` (`commands/init.ts`) to persist the `promptFrameworkSelection()` answer into `oprim/config.yaml`'s `integrations.spec_framework`, in addition to any existing Claude hooks config write
- [x] 1.3 Update `oprim update` (`commands/update.ts`) to add `integrations.spec_framework` to existing configs that lack it, preserving all other existing values

## 2. Framework selection

- [x] 2.1 Add `native` as a third choice to `promptFrameworkSelection()` in `install-agent.ts` (alongside existing `openspec` / `none`)
- [x] 2.2 Thread the resolved `framework` value through to `installAgentSkills()` / wrapper functions so it reaches `promoteContent()` instead of being discarded after `hooksConfig()`

## 3. Native spec-authoring skill

- [x] 3.1 Author the native spec-authoring skill content (name TBD, e.g. `oprim-spec`) in `install-agent.ts`, generating RFC 2119 (SHALL/SHOULD/MAY) requirements + Gherkin (`#### Scenario` GIVEN/WHEN/THEN) scenarios
- [x] 3.2 Wire the skill to write output to `oprim/specs/<capability>/spec.md`
- [x] 3.3 Register the skill for installation only when `integrations.spec_framework` is `native` (mirrors how OpenSpec-only skills are gated today)

## 4. Promote flow branching

- [x] 4.1 Parameterize `promoteContent()` to accept `framework: 'openspec' | 'native' | 'none'`
- [x] 4.2 Add the `native` branch: invoke the native spec-authoring skill instead of `/opsx:propose`, link the bet decision to the resulting `oprim/specs/<capability>/spec.md` path
- [x] 4.3 Confirm the `none` branch continues to skip spec generation and link nothing (no behavior change)
- [x] 4.4 Confirm the `openspec` branch is unchanged (regression check against existing promote behavior)

## 5. Tests

- [x] 5.1 Add/extend tests (real temp directories, no filesystem mocking, per repo convention) covering: `native` selection persists to `oprim/config.yaml`; `oprim update` adds the key without disturbing existing config; native spec-authoring skill produces a valid spec file with no OpenSpec present; promote branches correctly on each of `openspec` / `native` / `none`

## 6. Documentation

- [x] 6.1 Update this repo's own `CLAUDE.md` / `oprim/config.yaml` if the `native` framework is dogfooded here — not applicable: this repo dogfoods `openspec` (`integrations.openspec.enabled: true`), not `native`
- [x] 6.2 Update `oprim/bets/BET-023.../bet-decision.md` `## Links` with the final skill/command name chosen in 3.1
