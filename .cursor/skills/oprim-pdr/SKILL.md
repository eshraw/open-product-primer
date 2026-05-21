---
name: oprim-pdr
description: Create a new Product Decision Record in primer/decisions/ with auto-assigned ID and guided prompting
---

Create a new Product Decision Record (PDR) in `primer/decisions/`.

## Steps

### 1. Get the decision title

If not already provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID

Scan `primer/decisions/` for files matching the pattern `PDR-(\d+)-` (e.g. `PDR-001-onboarding-strategy.md`).
Extract all captured integers. Assign `max(extracted) + 1`, zero-padded to 3 digits.
If no files match, assign `001`.

Build the slug: take the title, lowercase, replace spaces with hyphens, remove non-alphanumeric characters (except hyphens).

Output path: `primer/decisions/PDR-NNN-<slug>.md`

### 3. Gather PDR content

Ask the following questions (you may ask them together or in sequence based on context):

- **Context**: "What forced this decision? What is the background or constraint that makes this decision necessary?"
- **Decision**: "State the decision clearly. What is being decided?"
- **Alternatives**: "What alternatives were considered, and why were they rejected?" (list format)
- **Consequences**: "What are the positive outcomes? What are the trade-offs? What follow-up actions are needed?"
- **Evidence**: "Are there any research links, data references, or supporting evidence?" (optional, can be left blank)
- **Related bets**: "Which BET IDs does this PDR relate to?" (optional)
- **Related OpenSpec changes**: "Which OpenSpec change paths does this relate to?" (optional)

### 4. Check for supersession

Ask: "Does this PDR supersede an existing PDR? If so, which ID? (e.g. PDR-003, or press Enter to skip)"

### 5. Write the PDR file

Write `primer/decisions/PDR-NNN-<slug>.md` with this exact structure:

```
# PDR-NNN: <title>

## Status
Proposed

## Context
<context from step 3>

## Decision
<decision statement from step 3>

## Alternatives considered
<alternatives from step 3, as bullet list>

## Consequences
- Positive: <positives>
- Trade-offs: <trade-offs>
- Follow-ups: <follow-ups>

## Evidence
<evidence links, or "None" if not provided>

## Related
- Bets: <BET-IDs, or "None">
- OpenSpec: <change paths, or "None">
- Supersedes: <PDR-ID if superseding, otherwise "None">
```

### 6. Update superseded PDR (if applicable)

If the user specified a PDR to supersede:
- Read the superseded PDR file
- Find the `## Status` section and replace the status value (the line after `## Status`) with: `Superseded by PDR-NNN`
- Write the updated file back

Both files must be written in the same response.

### 7. Report

```
## Created: PDR-NNN — <title>

File: primer/decisions/PDR-NNN-<slug>.md
Status: Proposed
<if superseding>Superseded: PDR-XXX → status updated

Next steps:
- Update status to "Accepted" when the decision is confirmed
- Link to bets via /oprim:bet or update existing bet-decision.md files
```
