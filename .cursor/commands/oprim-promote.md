---
name: /oprim-promote
id: oprim-promote
category: Workflow
description: Promote a prioritized bet to an OpenSpec change with criteria contract linking
---

Promote a prioritized bet to an OpenSpec change and link criteria contracts.

**Input**: Specify a bet ID (e.g., `/oprim-promote BET-042`) or omit to be prompted.

**Steps**

1. **Locate the bet** — read `primer/bets/BET-XXX/bet-decision.md`
2. **Validate status** — decision status must be "Build now"
3. **Check authority boundary** — verify primer artifact contains only why/order/outcome data
4. **Create OpenSpec change** — run `openspec propose <change-name>` or create the change directory
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision `## Links` section
   - Add originating bet ID to OpenSpec proposal context
6. **Link criteria** — if `primer/bets/BET-XXX/criteria.yaml` exists, reference it from the OpenSpec proposal
7. **Report** — show what was linked and what remains for engineering

**Authority boundary check**

Before completing, verify the boundary is intact:

| Artifact | Owns | Must NOT contain |
|----------|------|-----------------|
| `primer/bets/BET-XXX/bet-decision.md` | rationale, priorities, outcomes | implementation requirements, design |
| `primer/bets/BET-XXX/criteria.yaml` | metric contracts | query definitions, instrumentation |
| `openspec/changes/<name>/proposal.md` | requirements, what/how | prioritization rationale, outcome commitments |

**Output**

```
## Promoted: BET-XXX → openspec/changes/<change-name>

Linked:
- primer/bets/BET-XXX/bet-decision.md → updated with OpenSpec change path
- primer/bets/BET-XXX/criteria.yaml → referenced in openspec/changes/<change-name>/proposal.md

Authority boundary: verified

Next: run /opsx-apply <change-name> to implement.
```
