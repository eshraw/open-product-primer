---
name: oprim-bet
description: Create a new bet directory and bet-decision artifact in primer/bets/, and add the bet to primer/sequence.yaml backlog
---

Create a new bet in `primer/bets/` and register it on the sequencing board.

## Steps

### 1. Get the bet title

If not already provided, ask: "What is the title of this bet?"

### 2. Assign the next BET ID

Scan `primer/bets/` for directories matching the pattern `BET-(\d+)$` (e.g. `BET-001`, `BET-042`).
Extract all captured integers. Assign `max(extracted) + 1`, zero-padded to 3 digits.
If no directories match, assign `001`.

### 3. Check sequence.yaml exists

Verify `primer/sequence.yaml` exists. If it does not:
- Report: "`primer/sequence.yaml` not found. Run `oprim init` to create the primer workspace before creating bets."
- Stop.

### 4. Gather bet-decision content

Ask the following (you may combine questions where natural):

- **Decision**: "What is the decision? (Build now / Defer / Kill)" — default to "Build now"
- **Owner**: "Who owns this bet?"
- **Review date**: "When should this be reviewed?" (YYYY-MM-DD)
- **Why now**: "Why should this bet be prioritised now? What is the opportunity or forcing function?"
- **Alternatives**: "What alternatives were considered, and why were they rejected?"
- **Expected outcomes**: "What outcomes do you expect? List as: metric: baseline → target in timeframe"
- **Kill criteria**: "What would trigger rolling this back or stopping the bet?"
- **PDR links**: "Which PDR IDs does this bet relate to?" (optional, can be left blank)

### 5. Write the bet-decision file

Create directory `primer/bets/BET-NNN/` and write `primer/bets/BET-NNN/bet-decision.md`:

```
# Decision: BET-NNN <title>

## Status
- Decision: <decision>
- Date: <today's date YYYY-MM-DD>
- Owner: <owner>
- Review date: <review date>

## Why now
<why-now content as bullet list>

## Alternatives considered
<alternatives as bullet list>

## Expected outcomes
<outcomes as bullet list: metric: baseline → target in timeframe>

## Kill criteria / rollback trigger
<kill criteria as bullet list>

## Links
- PDRs: <PDR-IDs, or "None">
- OpenSpec change: <to be filled when promoted>
```

### 6. Append to sequence.yaml backlog

Read `primer/sequence.yaml`, parse the YAML, and append this entry to the `backlog` list:

```yaml
- id: BET-NNN
  title: "<title>"
  blocked_by: []
  unlocks: []
  requires_pdrs: []
```

Write the file back with consistent 2-space YAML indentation.

### 7. Report

```
## Created: BET-NNN — <title>

Files:
- primer/bets/BET-NNN/bet-decision.md
- primer/sequence.yaml (backlog updated)

Next steps:
- Run /oprim:criteria BET-NNN to define success metrics
- Run /oprim:sequence to move the bet to 'next' or 'now' when ready
- Run /oprim:promote BET-NNN to link to an OpenSpec change when approved for implementation
```
