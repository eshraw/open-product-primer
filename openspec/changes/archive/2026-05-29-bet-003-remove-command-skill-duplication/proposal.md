## Context

- Bet: BET-003 (`oprim/bets/BET-003/bet-decision.md`)

## Why

The oprim agent surface exposes each workflow through both a `/oprim:*` slash command and an `oprim-*` skill, but the commands are thin wrappers that only invoke the skill — no shorter to type, no additional context, just noise. The duplication creates confusion about which entry point to use with no ergonomic payoff.

## What Changes

- Remove four command files that are pure skill-delegation wrappers: `bet.md`, `criteria.md`, `pdr.md`, `review.md` from `.claude/commands/oprim/`
- The canonical entry points become the `oprim-*` skills invoked directly via the Skill tool
- `promote.md` and `sequence.md` are retained — they contain their own workflow content and have no corresponding skill counterpart
- Update any CLAUDE.md or documentation references that direct users to the removed commands

## Capabilities

### New Capabilities
<!-- None — this change removes surface, does not add any. -->

### Modified Capabilities
- `bet-authoring`: invocation changes from `/oprim:bet` slash command to `oprim-bet` skill
- `criteria-authoring`: invocation changes from `/oprim:criteria` slash command to `oprim-criteria` skill
- `pdr-authoring`: invocation changes from `/oprim:pdr` slash command to `oprim-pdr` skill
- `kpi-review-authoring`: invocation changes from `/oprim:review` slash command to `oprim-review` skill

## Impact

- `.claude/commands/oprim/bet.md` — deleted
- `.claude/commands/oprim/criteria.md` — deleted
- `.claude/commands/oprim/pdr.md` — deleted
- `.claude/commands/oprim/review.md` — deleted
- `.claude/commands/oprim/promote.md` — retained (has own content, no skill counterpart)
- `.claude/commands/oprim/sequence.md` — retained (has own content, no skill counterpart)
- Any CLAUDE.md or onboarding docs referencing `/oprim:bet`, `/oprim:criteria`, `/oprim:pdr`, `/oprim:review` — updated to reference skill invocation
- No data model changes; no breaking changes to artifacts or YAML schemas
