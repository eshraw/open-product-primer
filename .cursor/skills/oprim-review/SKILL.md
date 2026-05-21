---
name: oprim-review
description: Create a KPI review artifact for a completed bet, pre-filled from criteria.yaml with actuals gathered from the user
---

Create a KPI review artifact in `primer/reviews/`.

## Steps

### 1. Identify the bet

If a BET ID was not provided, ask: "Which bet are you reviewing? (e.g. BET-042)"

### 2. Load criteria for pre-fill

Attempt to read `primer/bets/BET-NNN/criteria.yaml`.

**If the file exists:** parse the metrics list. You will pre-fill baseline and target columns from it.

**If the file does not exist:** inform the user — "No criteria.yaml found for BET-NNN. You can add metrics manually during this review, or run `/oprim:criteria BET-NNN` first." Continue with an empty metrics list.

### 3. Gather actuals for each metric

For each metric in the criteria file (or if no criteria, ask how many metrics to review):

Show:
```
Metric: <name>
Baseline: <baseline>  Target: <target>
```

Ask: "What was the actual result? (enter a number, or 'pending' if not yet available)"

**Determine status:**
- If actual is a number and `actual >= target`: status = `hit`
- If actual is a number and `actual < target`: status = `missed`
- If user enters 'pending' or leaves blank: status = `pending`

### 4. Get review metadata

Ask:
- "Who is conducting this review?"
- "What is your assessment of decision quality? Did the outcomes validate the original decision? What would you do differently?"

### 5. Build the output path

Output path: `primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md` where YYYY-MM-DD is today's date.

### 6. Write the review artifact

```markdown
# KPI Review: BET-NNN

**Review date:** YYYY-MM-DD
**Reviewed by:** <reviewer>

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| <metric 1 name> | <baseline> | <target> | <actual> | <hit|missed|pending> |
| <metric 2 name> | ...        | ...      | ...      | ...                   |

## Decision quality
<decision quality notes>

## Actions
- [ ] Update bet-decision outcome section
- [ ] Update affected PDRs
- [ ] Re-sequence impacted bets
```

### 7. Report

```
## Review created: BET-NNN

File: primer/reviews/YYYY-MM-DD-BET-NNN-kpi.md

Results:
<for each metric: name — actual/target (status)>

Next steps:
- Complete the Actions checklist in the review file
- Update primer/bets/BET-NNN/bet-decision.md with an Outcomes section
- Run /oprim:sequence to re-evaluate sequencing based on outcomes
```
