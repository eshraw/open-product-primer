---
name: "OPRIM: Promote"
description: Promote a prioritized bet to an OpenSpec change
category: Workflow
tags: [workflow, primer]
---

Promote a prioritized bet to an OpenSpec change.


Promote a prioritized bet to an OpenSpec change and link criteria contracts.

**Input**: Specify a bet ID (e.g., `/oprim:promote BET-042`) or omit to be prompted.

**Steps**

1. **Locate the bet** — read `primer/bets/BET-XXX/bet-decision.md`
2. **Validate status** — decision must be "Build now"
3. **Check authority boundary** — confirm primer artifact owns why/order/outcome only
4. **Create OpenSpec change** — run `openspec propose <change-name>` or create change directory
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision `## Links` section
   - Add bet ID to OpenSpec proposal context
6. **Copy criteria** — if `primer/bets/BET-XXX/criteria.yaml` exists, link it from OpenSpec proposal
7. **Report** — show what was linked and what remains for engineering
