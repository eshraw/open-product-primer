---
name: oprim-bet
description: Create a new bet directory and bet-decision artifact in primer/bets/, and add the bet to primer/sequence.yaml backlog
---

Create a new bet in `primer/bets/` and register it on the sequencing board.

## Steps

### 1. Get the bet title
If not provided, ask: "What is the title of this bet?"

### 2. Assign the next BET ID
Scan `primer/bets/` for directories matching `BET-(\d+)$`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default `001` if none.

### 3. Check sequence.yaml exists
If `primer/sequence.yaml` not found: report and stop — advise `oprim init`.

### 4. Gather content
Ask: Decision (Build now / Defer / Kill, default Build now), Owner, Review date (YYYY-MM-DD), Why now, Alternatives considered, Expected outcomes (metric: baseline → target in timeframe), Kill criteria / rollback trigger, PDR links (optional).

### 5. Write primer/bets/BET-NNN/bet-decision.md
```
# Decision: BET-NNN <title>

## Status
- Decision: <decision>
- Date: <today YYYY-MM-DD>
- Owner: <owner>
- Review date: <review date>

## Why now
<why-now as bullet list>

## Alternatives considered
<alternatives as bullet list>

## Expected outcomes
<outcomes as bullet list>

## Kill criteria / rollback trigger
<kill criteria as bullet list>

## Links
- PDRs: <PDR-IDs or "None">
- OpenSpec change: <to be filled when promoted>
```

### 6. Append to primer/sequence.yaml backlog
Read → parse YAML → append → write back (2-space indentation):
```yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
```

### 7. Report what was created
