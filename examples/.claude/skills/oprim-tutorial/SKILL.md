---
name: oprim-tutorial
description: Guided walkthrough of the oprim bet -> spec -> archive cycle inside the todo-app example workspace (examples/) -- creates a real "add due dates to tasks" bet, specs it, and archives it, narrating each step against the example's existing PDRs, bets, and current-truth specs
---

Walk the user through one full oprim workflow cycle — bet → spec → archive — inside this example workspace, using a real new feature for the mock todo app: **"Add due dates to tasks."** This is not a simulation: it invokes the same `oprim-bet`, `oprim-spec`, and `oprim-archive` skills a real project uses, against this workspace's real files.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question you ask directly. When a step delegates to another skill via the Skill tool, that skill drives its own prompts.

## Before you start

Orient the user in 2-3 sentences before Step 1:
- This workspace (`oprim/`) already has a working example: `PDR-001`/`PDR-002` record two early product decisions, `BET-001` (archived) shipped the core add/complete/delete loop, and `oprim/specs/task-management/spec.md` is that feature's current-truth spec. `BET-002` (pending) is a backlog idea for later.
- This tutorial adds a new bet on top of that foundation — due dates — and carries it all the way through the cycle: bet decision → spec delta → archive.

## Steps

### 1. Create the bet
Invoke the **`oprim-bet`** skill using the Skill tool. Suggest (but do not force) the title **"Add due dates to tasks"** if the user doesn't already have one in mind, and note that PDR-001 (flat lists) and PDR-002 (local-only storage) are the relevant prior decisions to link.

After the skill finishes, confirm the new bet's ID (it will be the next available `BET-NNN` — `BET-003` if this is the first tutorial run) and its directory under `oprim/bets/pending/`.

### 2. Author the spec delta
Invoke the **`oprim-spec`** skill using the Skill tool, passing the bet ID from Step 1. When it asks for a capability name, suggest **"task-management"** — the same capability `BET-001` shipped — since due dates extend that existing surface rather than introducing a new one. When it asks whether each requirement is ADDED/MODIFIED/REMOVED, this is an ADDED requirement (due dates are new, nothing existing changes).

This also scaffolds `design.md` and `tasks.md` for the bet (first `oprim-spec` invocation for a bet always does). Point the user at both files afterward.

### 3. Note the pre-archive state
Before archiving, briefly show the user what's about to change:
- `oprim/bets/pending/BET-NNN-.../` will move to `oprim/bets/archived/`
- The new ADDED requirement(s) will be appended to the existing `oprim/specs/task-management/spec.md` (current truth), alongside the three requirements `BET-001` already put there
- The bet's entry will be removed from `oprim/sequence.yaml`

This is the same fold `/oprim:archive` performs on any real project — nothing tutorial-specific happens here.

### 4. Archive the bet
Invoke the **`oprim-archive`** skill using the Skill tool, passing the bet ID from Step 1. Let it run its normal checks (dependents, delta overlaps, incomplete `tasks.md`) — if `tasks.md` still has unchecked items, that's expected for a fresh tutorial run; the user can confirm through the warning or check off items first.

### 5. Show the result
Report what changed, pointing at real file paths:
- `oprim/bets/archived/BET-NNN-.../` — the completed bet, in full
- `oprim/specs/task-management/spec.md` — now includes the due-date requirement(s) alongside `BET-001`'s original three
- `oprim/sequence.yaml` — no longer lists `BET-NNN`

Close by telling the user they just completed a full oprim cycle — the same one this tool uses on itself (see this repository's own `oprim/` workspace) — and that running it again works identically on their own project after `oprim init`.
