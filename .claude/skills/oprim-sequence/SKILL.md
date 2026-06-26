---
name: oprim-sequence
description: Validate and update the primer sequencing board — triage mode computes board health and surfaces specific suggestions; seeded mode targets a specific context
---

Manage the primer sequencing board in `oprim/sequence.yaml`.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Entry modes

**Triage mode** — no intention provided: reads board state, computes health, surfaces specific actionable suggestions.
**Seeded mode** — context pre-provided (e.g. from a lifecycle hook): skips full triage and targets the most relevant move for that context.

## Steps

### 1. Determine mode

If lifecycle context was provided as an argument or pre-seeded in the conversation (e.g. `bet-created`, `bet-promoted`, or a specific bet ID was just archived), enter **Seeded mode** — go to Step 2B.

Otherwise, enter **Triage mode** — go to Step 2A.

### 2A. Triage mode — compute board health

Read `oprim/sequence.yaml`. Compute:

- **WIP utilization**: count entries in `now` vs `wip_limits.now`
- **WIP violations**: entries in `now` that exceed the WIP limit
- **Blocked Now bets**: entries in `now` whose `blocked_by` list contains a bet ID still present in any active lane (now/next/later/backlog)
- **Ready-to-pull bets**: entries in `next` whose `blocked_by` list is empty or all resolved (each blocked_by ID is absent from all active lanes)
- **PDR gaps**: entries in any lane whose `requires_pdrs` list contains a PDR ID not found in `oprim/decisions/`

Surface **ranked suggestions**, most urgent first:
1. WIP violations → name each excess bet, suggest deferring to `next` or `later`
2. Blocked Now bets → name the bet and its unresolved blocker, suggest deferring until blocker resolves
3. Open Now slot (count < `wip_limits.now`) with a ready Next bet → name a specific bet to pull into `now`
4. PDR gaps → name the bet and missing PDR, suggest creating it first

Each suggestion must name the exact bet ID, current lane, target lane, and reason.

If the board is healthy (no violations, no ready moves): report current WIP utilization and state the board is healthy. Offer to move something anyway if the user wants.

After surfacing suggestions, ask: "Which move would you like to make?"

### 2B. Seeded mode — target specific context

Use the provided context to jump to the most relevant suggestion:

- `bet-created`: A new bet just landed in backlog. Check if `now` has an open slot and `next` has a ready bet to pull. If so, suggest the specific bet to pull. Otherwise, confirm the new bet is in backlog and the board looks healthy.
- `bet-promoted`: A bet was just promoted to an OpenSpec change. Verify the bet is still correctly sequenced and surface any resequencing action the promotion warrants.
- Bet archived (e.g. "BET-011 was archived"): Check if `now` dropped below `wip_limits.now`. If so, find the most ready bet in `next` and suggest pulling it.

If no relevant move is found for the provided context, fall back to Triage mode (Step 2A).

### 3. Validate the requested move

Before executing any move, verify all three constraints:

**WIP limit**: Moving a bet to `now` must not push the count above `wip_limits.now`. If it would, explain the violation and suggest deferring an existing `now` bet first.

**Blocker resolution**: Moving a bet to `now` requires its `blocked_by` list to be empty or all resolved (IDs absent from all active lanes). If unresolved, name each unresolved blocker.

**PDR preconditions**: Moving a bet to `now` requires all `requires_pdrs` entries to exist as files in `oprim/decisions/`. If any are missing, name them and suggest creating them first.

If the move is invalid: explain which constraint failed and suggest the nearest valid alternative. Do not proceed to Step 4.

### 4. Preview and confirm

Show the exact YAML change before writing. Name the entry that will move: its `id`, `title`, source lane, and target lane.

```
Before:  BET-005 is in next  (now: 1/2 slots filled)
After:   BET-005 moves to now (now: 2/2 slots filled)
```

Ask: "Apply this change? (y/N)"
- If "n" or Enter: stop, no changes made.
- If "y": proceed to Step 5.

### 5. Write sequence.yaml

Read `oprim/sequence.yaml`. Remove the bet entry from its current lane. Insert it into the target lane. Write back with 2-space indentation. Do not modify any other entries.

### 6. Regenerate view

Run `node oprim/scripts/generate-sequence-view.js` from the project root to update `oprim/sequence-view.md`.

### 7. Report what was done
