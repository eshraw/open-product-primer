---
name: /oprim-sequence
id: oprim-sequence
category: Workflow
description: Validate and update the primer sequencing board
---

Validate the primer sequencing board and suggest rebalancing if needed.

**Input**: Optionally pass `--fix` to apply safe suggestions automatically.

**Steps**

1. **Read board** — load `primer/sequence.yaml`
2. **Check WIP limits** — compare `now` entry count against `wip_limits.now`
3. **Validate blockers** — for each bet in `now`, all `blocked_by` IDs must be resolved (shipped, not in `now`/`next`)
4. **Validate PDR preconditions** — all `requires_pdrs` IDs must have a file in `primer/decisions/`
5. **Detect unlock opportunities** — `next` bets whose blockers are resolved
6. **Report violations and opportunities**
7. **Suggest moves** to resolve violations

**Validation rules**

| Rule | Condition | Severity |
|------|-----------|----------|
| WIP limit | `now.length > wip_limits.now` | Error |
| Blocker unresolved | bet in `now` has active `blocked_by` | Error |
| Missing PDR | `requires_pdrs` entry has no file in `primer/decisions/` | Warning |
| Unlock available | `next` bet has all blockers resolved | Info |

**Output**

```
## Sequencing Board Validation

WIP: 3/2 (OVER LIMIT)

Errors:
- BET-051 in 'now' blocked by BET-042 (not yet shipped)

Suggestions:
- Move BET-051 to 'next' until BET-042 ships
```
