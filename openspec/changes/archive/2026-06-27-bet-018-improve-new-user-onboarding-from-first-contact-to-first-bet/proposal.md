## Why

New users drop off at two distinct points before they get value from oprim: (1) the README explains oprim's structure but not its value, losing developers who lack product methodology background before they ever run `init`; (2) `oprim init` succeeds but leaves users with no explanation of what to do next or what a "bet" even is, stalling action at the moment of highest intent. The methodology is introduced before it is earned.

## What Changes

- **README**: Reframe opening to lead with concrete value ("what oprim does for you in your workflow") before introducing structure and terminology. Users without Shape Up / product methodology background must understand the tool's purpose from first contact.
- **`oprim init` exit**: Add a context-sensitive next-step prompt after init completes that introduces the concept of a bet in plain terms and gives the user a clear single action to take.
- **First-bet creation**: Guide users through the bet command in a way that reveals what a bet is through action — not by requiring them to know product methodology first. The vocabulary earns itself.

## Capabilities

### New Capabilities
- `readme-first-contact`: README onboarding experience — value framing and plain-language explanation for methodology-naive developers arriving at the project for the first time
- `init-next-step-guidance`: Context-sensitive guidance rendered at the end of `oprim init` that names what to do next and defines "bet" in one sentence without requiring prior methodology knowledge

### Modified Capabilities
- `bet-authoring`: First-bet creation flow adapted to guide users who don't already know what a bet is — prompts and scaffolding that reveal the methodology through the act of creating, not through upfront documentation

## Impact

- `README.md` — content rewrite (structure preserved, framing changed)
- `packages/cli/src/commands/init.ts` — add post-init guidance output
- `packages/cli/src/lib/install-agent.ts` — if first-bet prompt is embedded in skill content, update accordingly
- `oprim/bets/BET-018-improve-new-user-onboarding-from-first-contact-to-first-bet/bet-decision.md` — linked from this change

## Context

- Bet: BET-018 (`oprim/bets/BET-018-improve-new-user-onboarding-from-first-contact-to-first-bet/bet-decision.md`)
