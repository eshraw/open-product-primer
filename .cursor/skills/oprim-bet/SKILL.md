---
name: oprim-bet
description: Create a new bet directory and bet-decision artifact in oprim/bets/, and add the bet to oprim/sequence.yaml backlog
---

Create a new bet in `oprim/bets/` and register it on the sequencing board.

## Steps

### 1. Get the bet title
Display the naming convention before asking:

> **Naming tip:** Use "verb + object [for context]"
> - Good: "Improve bet naming for scannability"
> - Bad: "Naming"

If not provided, ask: "What is the title of this bet?"

After receiving the title, validate: if fewer than 4 words OR fewer than 25 characters:
- Show: "Warning: this title may be too vague to scan at a glance."
- Suggest a reformulation, e.g. "Consider: 'Improve <what> for <why>'"
- Ask: "Proceed with this title anyway? (y/N)"
  - If "n" or Enter: ask for a revised title and re-validate
  - If "y": proceed with the original title

### 2. Assign the next BET ID
Scan `oprim/bets/` for directories matching `BET-(\d+)`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default `001` if none.

### 3. Check sequence.yaml exists
If `oprim/sequence.yaml` not found: report and stop — advise `oprim init`.

### 4. Gather content
Ask: Decision (Build now / Defer / Kill, default Build now), Owner, Review date (YYYY-MM-DD), Why now, Alternatives considered, Expected outcomes (metric: baseline → target in timeframe), Kill criteria / rollback trigger, PDR links (optional).

### 5. Write oprim/bets/BET-NNN/bet-decision.md
```
# Decision: BET-NNN <title>
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

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

### 6. Append to oprim/sequence.yaml backlog
Read → parse YAML → append → write back (2-space indentation):
```yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
```

### 7. Prompt for optional discovery scaffolding
Ask: "Do you want to scaffold a discovery.md now? (y/N)"
- If "y": write `oprim/bets/BET-NNN/discovery.md` from the discovery template (same structure as `oprim/templates/discovery.md`).
- If "n" or Enter: skip silently.

### 8. Report what was created
