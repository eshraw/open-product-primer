---
name: /oprim-bet
id: oprim-bet
category: Workflow
description: Create a new bet decision and register it on the sequencing board
---

Create a new bet in `oprim/bets/`. Before asking for the title, show: "Naming tip: verb + object [for context] — Good: 'Improve bet naming for scannability' / Bad: 'Naming'". Scan `BET-(\d+)$` dirs for next ID (zero-padded, default 001). Check `oprim/sequence.yaml` exists (stop if not — advise oprim init). After receiving the title, validate: if fewer than 4 words OR fewer than 25 characters, warn "this title may be too vague", suggest a reformulation, and ask "Proceed anyway? (y/N)" — if "n", prompt for a revised title. Gather: decision (default Build now), owner, review date, why-now, alternatives, expected outcomes, kill criteria, PDR links. Write `oprim/bets/BET-NNN/bet-decision.md` with an inline naming tip comment after the title. Append entry to sequence.yaml backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`. Then ask: "Do you want to scaffold a discovery.md now? (y/N)" — if "y", write `oprim/bets/BET-NNN/discovery.md` from the discovery template (sections: Problem Framing, User Research Signals, Competitive Context, Open Questions); if "n" or Enter, skip silently. Report what was created.