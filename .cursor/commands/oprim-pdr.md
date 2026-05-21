---
name: /oprim-pdr
id: oprim-pdr
category: Workflow
description: Create a new Product Decision Record with auto-assigned ID
---

Create a new Product Decision Record (PDR) in `primer/decisions/`.

## Steps

### 1. Get the decision title

If not already provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID

Scan `primer/decisions/` for files matching the pattern `PDR-(\d+)-`.
Extract all captured integers. Assign `max(extracted) + 1`, zero-padded to 3 digits.
If no files match, assign `001`.

Build the slug: take the title, lowercase, replace spaces with hyphens, remove non-alphanumeric characters (except hyphens).

Output path: `primer/decisions/PDR-NNN-<slug>.md`

### 3. Gather PDR content

Ask: Context (what forced this decision), Decision (clear statement), Alternatives considered (why rejected), Consequences (positives, trade-offs, follow-ups), Evidence links (optional), Related bets (optional), Related OpenSpec changes (optional).

### 4. Check for supersession

Ask: "Does this PDR supersede an existing PDR? If so, which ID? (or press Enter to skip)"

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

Read the superseded PDR file, replace its Status value with `Superseded by PDR-NNN`, write back.

### 7. Report what was created
