---
name: /oprim-bet
id: oprim-bet
category: Workflow
description: Create a new bet decision and register it on the sequencing board
---

Create a new bet in `primer/bets/`. Scan `BET-(\d+)$` dirs for next ID (zero-padded, default 001). Check `primer/sequence.yaml` exists (stop if not — advise oprim init). Gather: title, decision (default Build now), owner, review date, why-now, alternatives, expected outcomes, kill criteria, PDR links. Write `primer/bets/BET-NNN/bet-decision.md`. Append entry to sequence.yaml backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`. Report what was created.