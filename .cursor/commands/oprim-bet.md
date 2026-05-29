---
name: /oprim-bet
id: oprim-bet
category: Workflow
description: Create a new bet decision and register it on the sequencing board
---

Create a new bet in `oprim/bets/`. Scan `BET-(\d+)$` dirs for next ID (zero-padded, default 001). Check `oprim/sequence.yaml` exists (stop if not — advise oprim init). Gather: title, decision (default Build now), owner, review date, why-now, alternatives, expected outcomes, kill criteria, PDR links. Write `oprim/bets/BET-NNN/bet-decision.md`. Append entry to sequence.yaml backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`. Then ask: "Do you want to scaffold a discovery.md now? (y/N)" — if "y", write `oprim/bets/BET-NNN/discovery.md` from the discovery template (sections: Problem Framing, User Research Signals, Competitive Context, Open Questions); if "n" or Enter, skip silently. Report what was created.