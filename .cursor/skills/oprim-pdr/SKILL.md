---
name: oprim-pdr
description: Create a new Product Decision Record in oprim/decisions/ with auto-assigned ID and guided prompting
---

Create a new Product Decision Record (PDR) in `oprim/decisions/`.

## Steps

### 1. Get the decision title
If not provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID
Scan `oprim/decisions/` for files matching `PDR-(\d+)-`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default `001` if none found.
Slug: title → lowercase → spaces to hyphens → remove non-alphanumeric (except hyphens).
Output path: `oprim/decisions/PDR-NNN-<slug>.md`

### 3. Gather content
Ask: Context (what forced this decision), Decision (clear statement), Alternatives considered (why rejected), Consequences (positives / trade-offs / follow-ups), Evidence links (optional), Related bets (optional), Related OpenSpec changes (optional).

### 4. Check for supersession
Ask: "Does this supersede an existing PDR? If so, which ID? (Enter to skip)"

### 5. Write the PDR file
```
# PDR-NNN: <title>

## Status
Proposed

## Context
<context>

## Decision
<decision>

## Alternatives considered
<alternatives as bullet list>

## Consequences
- Positive: <...>
- Trade-offs: <...>
- Follow-ups: <...>

## Evidence
<evidence or "None">

## Related
- Bets: <BET-IDs or "None">
- OpenSpec: <change paths or "None">
- Supersedes: <PDR-ID or "None">
```

### 6. Update superseded PDR (if applicable)
Read the superseded file → replace Status value with `Superseded by PDR-NNN` → write back.

### 7. Report what was created
