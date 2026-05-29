---
name: "OPRIM: Sequence"
description: Validate and update the primer sequencing board
category: Workflow
tags: [workflow, primer]
---

Validate and update the primer sequencing board.


Validate the primer sequencing board and suggest rebalancing if needed.

**Steps**

1. **Read board** — load `oprim/sequence.yaml`
2. **Check WIP limits** — compare `now` count against `wip_limits.now`
3. **Validate blockers** — for each bet in `now`, confirm all `blocked_by` entries are complete or absent
4. **Validate PDR preconditions** — confirm all `requires_pdrs` entries exist in `oprim/decisions/`
5. **Report violations** — list any WIP excess, unresolved blockers, or missing PDRs
6. **Suggest moves** — recommend bets to defer to `next` or `later` to resolve violations
7. **Regenerate view** — run `node oprim/scripts/generate-sequence-view.js` to update `oprim/sequence-view.md`. Report the path written. If `sequence.yaml` was changed in this session, both files should be staged together.
