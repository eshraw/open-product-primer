## Context

Originating bet: `BET-025` (`oprim/bets/BET-025-supercharge-oprim-config-with-merge-on/bet-decision.md`)
Relates to: `BET-023` (`bet-023-native-spec-authoring`, which needs a merge-safe way to add its own `integrations.spec_framework` key), `BET-026` (remote stores, which needs the `store:` key this bet introduces)

## Why

`oprim/config.yaml`'s schema is thin today (project / integrations / measurement / sequencing / agents) and config is currently preserved on update only because nothing ever touches it after `init` writes it (`writeFileIfAbsent`) — there is no mechanism to safely introduce new schema keys to existing projects without either leaving them stranded on an old schema or clobbering user-set values. OpenSpec's own config demonstrates a proven pattern worth adapting: a free-text `context:` block plus per-artifact `rules:` injected into agent prompts.

## What Changes

- Expand `oprim/config.yaml`'s schema with: a free-text `context:` block (language, tech stack, project conventions), per-artifact `rules:` (custom instructions injected into bet/PDR/spec/review generation prompts), and a placeholder `store:` key reserved for BET-026
- Add a merge-on-update mechanism: `oprim update` reads the existing `oprim/config.yaml`, adds any schema keys introduced since the project was last updated with their default values, and leaves every existing user-set value untouched
- The merge SHALL NOT reorder existing keys, drop unknown keys, or overwrite anything the user has already set — additive only
- Downstream artifact generation (bets, PDRs, specs, reviews) SHALL honor `context:` and `rules:` where present, folding them into the generated content/prompts

## Capabilities

### New Capabilities
- `config-schema-merge`: the expanded `oprim/config.yaml` schema (`context:`, `rules:`, placeholder `store:`) and the additive, non-destructive merge-on-update mechanism that introduces new keys without touching existing user values

### Modified Capabilities
(none — `project-installation`'s existing update/doctor requirements around agent detection and scaffold validity are unaffected; this bet adds a new, independent schema-merge behavior rather than changing how agents or scaffolding are handled)

## Impact

- `packages/cli/src/lib/templates.ts`: `oprim/config.yaml` template schema grows to include `context`, `rules`, `store` (placeholder, disabled)
- `packages/cli/src/commands/update.ts`: gains the generic merge step (add missing keys, preserve existing values) instead of leaving config untouched
- `packages/cli/src/commands/init.ts`: writes the fuller schema (with sensible empty/default values) on fresh init, unchanged for existing behavior otherwise
- Skill/command content that generates bets, PDRs, specs, or reviews (`install-agent.ts`) reads `context:`/`rules:` and includes them in generated prompts where applicable
- `BET-023`'s `integrations.spec_framework` key addition can adopt this bet's general merge mechanism once it lands, rather than its own one-off (per BET-023's design.md open question)
