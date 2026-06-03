## Context

- Bet: BET-008
- Bet decision: oprim/bets/BET-008/bet-decision.md

## Why

As the bet list grows, opaque bet titles force collaborators to open files before understanding purpose. Naming discipline is cheapest at creation time—retroactively renaming is harder—and a clear convention applied at the `oprim-bet` skill level fixes the root problem for all future bets.

## What Changes

- The `oprim-bet` skill SHALL prompt the user for a descriptive, self-explanatory title following a naming convention (verb + noun + context) before writing `bet-decision.md`
- The skill SHALL validate that the title is not a vague stub (e.g., rejects single-word titles or titles under a minimum character threshold)
- The skill documentation and scaffolded `bet-decision.md` template SHALL include an inline example of a good vs. bad title
- Existing bet titles in `sequence.yaml` are **not** retroactively renamed (out of scope)

## Capabilities

### New Capabilities

_(none — this change extends existing bet-authoring behavior)_

### Modified Capabilities

- `bet-authoring`: Add naming convention requirement to `oprim-bet` skill — the skill SHALL guide and validate the bet title at creation time to ensure it is self-explanatory on first read

## Impact

- `oprim-bet` skill file (naming guidance + title validation logic)
- `bet-decision.md` template (inline naming example)
- `openspec/specs/bet-authoring/spec.md` (new WHEN/THEN requirements for title validation)
