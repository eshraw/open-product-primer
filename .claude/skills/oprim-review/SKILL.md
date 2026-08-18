---
name: oprim-review
description: Create a KPI review artifact for a completed bet, pre-filled from criteria.yaml with actuals gathered from the user
---

## Step 0: Check relevant product decisions
Invoke the `oprim:context` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or `oprim/decisions/` is empty, the skill exits silently — continue to Step 1 immediately.

Create a KPI review in `oprim/reviews/`.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Identify the bet
If not provided, ask: "Which bet are you reviewing? (e.g. BET-042)"

### 1b. Check for custom rules
Read `oprim/config.yaml`. If it has a non-empty `rules.review` value, treat it as additional guidance from the team — factor it into the questions you ask in step 4 and reflect it in the generated review content. If `rules.review` is absent or empty, skip this step; behavior is unchanged.

### 2. Load criteria and check for a run result

Read `oprim/bets/pending/BET-NNN/criteria.yaml` if it exists (pre-fills baseline and target).
If not found: inform user and continue with empty metrics list.

**Check for measurement run result:** Scan `oprim/bets/pending/BET-NNN/measurements/` for files matching `run-*.yaml`. If any exist, sort by filename (date-based) and read the most recent.

**If a run result exists:** use it to pre-populate actuals and status for every metric. Skip step 3 for those metrics. Note the run date — include "Actuals from run: YYYY-MM-DD" in the review artifact.

**If no run result exists:** proceed to step 3 to gather actuals manually.

### 3. Gather actuals per metric (only when no run result)
For each metric show name/baseline/target and ask: "What was the actual result? (number or 'pending')"

Status logic:
- actual >= target → `hit`
- actual < target → `missed`
- 'pending' or not provided → `pending`

### 4. Get review metadata
Ask: reviewer name, decision quality notes.

### 5. Output path
`oprim/reviews/YYYY-MM-DD-BET-NNN-kpi.md` (today's date)

### 5b. Check for OKF frontmatter
Read `oprim/templates/kpi-review.md`. If it begins with a YAML frontmatter block (`---` ... `---`), this workspace has OKF frontmatter enabled. Ask for a one-line description and comma-separated tags (derived from the reviewed bet's subject area). Prepare a frontmatter block with `type: kpi-review`, `title: <bet ID and title>`, `description: <description>`, `tags: [<tags>]`, `timestamp: <review date, ISO 8601>`, to prepend in step 6.
If no frontmatter block is found in the template, skip this step — write the file with no frontmatter, matching current behavior.

### 6. Write the review file
Prepend the frontmatter block from step 5b, if one was prepared.
```markdown
# KPI Review: BET-NNN

**Review date:** YYYY-MM-DD
**Reviewed by:** <reviewer>
**Actuals from run:** YYYY-MM-DD  ← include only when a run result was ingested

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
