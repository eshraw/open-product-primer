---
name: /oprim-review
id: oprim-review
category: Workflow
description: Create a KPI review artifact pre-filled from a bet's criteria contract
---

Create a KPI review in `primer/reviews/` for a completed bet.

## Steps

### 1. Identify the bet

If BET ID not provided, ask: "Which bet are you reviewing?"

### 2. Load criteria for pre-fill

Read `primer/bets/BET-NNN/criteria.yaml` if it exists (pre-fills baseline and target).
If not found: inform the user and continue with an empty metrics list.

### 3. Gather actuals per metric

For each metric, show name/baseline/target and ask: "What was the actual result? (number or 'pending')"

**Status logic:**
- `actual >= target` → `hit`
- `actual < target` → `missed`
- not provided / 'pending' → `pending`

### 4. Get review metadata

Ask: reviewer name, decision quality notes (did outcomes validate the decision?).

### 5. Output path

`primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md` (today's date)

### 6. Write the review file

```markdown
# KPI Review: BET-NNN

**Review date:** YYYY-MM-DD
**Reviewed by:** <reviewer>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| <name> | <baseline> | <target> | <actual> | <status> |

## Decision quality
<notes>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
```

### 7. Report what was created
