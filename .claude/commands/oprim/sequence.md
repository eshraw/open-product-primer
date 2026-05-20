---
name: "OPRIM: Sequence"
description: Validate and update the primer sequencing board
category: Workflow
tags: [workflow, primer, sequencing]
---

Validate the primer sequencing board and suggest rebalancing if needed.

**Input**: Optionally pass `--fix` to apply safe suggestions automatically (defer over-WIP bets to `next`).

**Steps**

1. **Read board** — load `primer/sequence.yaml`
2. **Check WIP limits** — compare `now` entry count against `wip_limits.now`
3. **Validate blockers** — for each bet in `now`:
   - All `blocked_by` bet IDs must not be present in `now` or `next` (must be shipped)
4. **Validate PDR preconditions** — all `requires_pdrs` IDs must have a corresponding file in `primer/decisions/`
5. **Detect unlock opportunities** — identify `next` bets whose blockers have been resolved
6. **Report violations and opportunities**
7. **Suggest moves** — recommend specific bets to defer or promote to resolve violations

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

WIP: 3/2 (OVER LIMIT — 1 excess)

Errors:
- BET-051 in 'now' blocked by BET-042 (not yet shipped)
- WIP limit exceeded: 3 active, limit is 2

Warnings:
- BET-042 requires PDR-018 — file not found in primer/decisions/

Unlock opportunities:
- BET-055 in 'next' — all blockers resolved, eligible for 'now'

Suggestions:
1. Move BET-051 to 'next' (resolves WIP excess and blocker violation)
2. Create primer/decisions/PDR-018-name.md before moving BET-042 forward
```
