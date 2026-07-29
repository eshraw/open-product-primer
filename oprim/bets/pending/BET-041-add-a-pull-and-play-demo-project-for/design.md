# Design: demo-project

## Approach
Add an `examples/` directory at the repo root containing a minimal, pre-scaffolded `oprim/` workspace (config, sequence board, PDRs/bets) scoped to a small mock product — a todo app — plus a `.claude/` (or equivalent agent) install already run against it, so a clone works immediately without `oprim init`. Pair it with a guided tutorial command/skill that drives the user through one full bet → spec → archive cycle inside that example workspace, narrating each step against the todo app's real content.

## Key decisions
- **Location**: `examples/` at repo root, not a separate repo — lower friction to discover and pull, avoids syncing a second repo (per bet's "Alternatives considered").
- **Mock product, not an empty workspace**: the example is scoped to a small, relatable mock product (a todo app) so a first-time user sees realistic bets/PDRs/specs instead of a blank board with nothing to relate to. Todo app chosen because its feature surface (add/complete/delete tasks, lists, due dates) is small enough to keep the example maintainable but rich enough to motivate a handful of illustrative bets and one spec'd capability.
- **Pre-scaffolded, not generated on first run**: the example workspace ships already initialized (including the mock todo-app content) so the very first command a user runs is the tutorial itself, not `oprim init`.
- **Tutorial as a command/skill**, reusing the existing workflow schema + template pattern (`workflow-schema.ts` / `workflow-renderer.ts`) rather than a new bespoke mechanism, so it's installed the same way other `/oprim:*` workflows are. The tutorial's guided bet → spec → archive cycle operates on a *new* todo-app feature (e.g. "add due dates to tasks") so the user experiences the full workflow rather than just replaying pre-filled content.

## Alternatives considered
- Docs-only walkthrough (README) — cheaper but not hands-on; rejected per bet rationale.
- Separate public example repo — rejected: extra sync burden, more discovery friction.

## Risks
- Example workspace can drift out of sync with the CLI's actual bundled workflow content over time (maintenance cost, not viability risk per the bet's risk profile).
- Tutorial script must handle re-runs / partial completion gracefully if a user aborts partway through the guided cycle.
