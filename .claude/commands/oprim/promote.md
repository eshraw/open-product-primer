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

1. **Locate the bet** — read `oprim/bets/BET-XXX/bet-decision.md`
2. **Validate status** — decision must be "Build now"
3. **Check authority boundary** — confirm primer artifact owns why/order/outcome only
4. **Create OpenSpec change** — derive the change name as `bet-NNN-<slug>` where `NNN` is the zero-padded bet number (e.g. BET-004 → `bet-004`) and `<slug>` is a short kebab-case summary of the change. Then invoke the `/openspec-propose` skill (or `/opsx:propose`) with that name to create the change directory with **all required artifacts**: `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md` for every capability listed under `## Capabilities`.
   - Pass the bet decision content as context so the proposal reflects the bet's why/outcome
   - **Do not manually create a partial change directory** — the propose skill ensures no artifact is omitted
   - The spec file(s) are mandatory: each capability modified or added must have WHEN/THEN scenarios under `## ADDED Requirements` or `## MODIFIED Requirements`
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision `## Links` section
   - Add bet ID to OpenSpec proposal `## Context` section
6. **Copy criteria** — if `oprim/bets/BET-XXX/criteria.yaml` exists, link it from OpenSpec proposal
7. **Verify completeness** — confirm the change directory contains:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/<capability>/spec.md` for each capability in `## Capabilities`
   If any artifact is missing, create it before reporting done.
8. **Report** — show what was linked and what remains for engineering
