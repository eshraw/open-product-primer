---
name: /oprim-sequence
id: oprim-sequence
category: Workflow
description: Validate and update the primer sequencing board
---


Validate the primer sequencing board and suggest rebalancing if needed.

**Steps**

1. **Read board** — load `primer/sequence.yaml`
2. **Check WIP limits** — compare `now` count against `wip_limits.now`
3. **Validate blockers** — for each bet in `now`, confirm all `blocked_by` entries are complete or absent
4. **Validate PDR preconditions** — confirm all `requires_pdrs` entries exist in `primer/decisions/`
5. **Report violations** — list any WIP excess, unresolved blockers, or missing PDRs
6. **Suggest moves** — recommend bets to defer to `next` or `later` to resolve violations
