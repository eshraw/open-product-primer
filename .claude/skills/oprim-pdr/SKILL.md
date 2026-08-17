---
name: oprim-pdr
description: Create a new Product Decision Record in oprim/decisions/ with auto-assigned ID and guided prompting
---

## Step 0: Check relevant product decisions
Invoke the `oprim:context` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or `oprim/decisions/` is empty, the skill exits silently — continue to Step 1 immediately.

Create a new Product Decision Record (PDR) in `oprim/decisions/`.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Get the decision title
If not provided, ask: "What is the title of this product decision?"

### 2. Assign the next PDR ID
Scan `oprim/decisions/` for files matching `PDR-(\d+)-`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default `001` if none found.
Slug: title → lowercase → spaces to hyphens → remove non-alphanumeric (except hyphens).
Output path: `oprim/decisions/PDR-NNN-<slug>.md`

### 2b. Check for custom rules
Read `oprim/config.yaml`. If it has a non-empty `rules.pdr` value, treat it as additional guidance from the team — factor it into the questions you ask in step 3 and reflect it in the generated content. If `rules.pdr` is absent or empty, skip this step; behavior is unchanged.

### 3. Gather content
Ask: Context (what forced this decision), Decision (clear statement), Alternatives considered (why rejected), Consequences (positives / trade-offs / follow-ups), Evidence links (optional), Related bets (optional), Related OpenSpec changes (optional).

### 4. Check for supersession
Ask: "Does this supersede an existing PDR? If so, which ID? (Enter to skip)"

### 4b. Check for OKF frontmatter
Read `oprim/templates/pdr.md`. If it begins with a YAML frontmatter block (`---` ... `---`), this workspace has OKF frontmatter enabled. Ask for a one-line description and comma-separated tags (subject-area keywords). Prepare a frontmatter block with `type: pdr`, `title: <title>`, `description: <description>`, `tags: [<tags>]`, `timestamp: <today's date, ISO 8601>`, to prepend in step 5.
If no frontmatter block is found in the template, skip this step — write the file with no frontmatter, matching current behavior.

### 5. Write the PDR file
Prepend the frontmatter block from step 4b, if one was prepared.
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

### 8. Regenerate the decisions rollup view
Run `node oprim/scripts/generate-decisions-view.js` from the project root to update `oprim/decisions-view.md`.
