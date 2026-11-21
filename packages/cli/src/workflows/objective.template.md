---
name: oprim-objective
description: Create a new objective (OKR) in oprim/objectives/ with auto-assigned OBJ ID, period and key results, or supersede an existing one
---

Create a new objective in `oprim/objectives/`. Objectives are the portfolio's OKRs: bets in this workspace — and in every product that registers this portfolio as a remote context source — link to them with `- Objectives: OBJ-NNN` (or `<source>:OBJ-NNN` from a product) in their `## Links` section.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Get the objective title
If not provided, ask: "What is the objective? (an outcome, e.g. 'Grow repeat purchases' — not a project)"

### 2. Assign the next OBJ ID
Scan `oprim/objectives/` for files matching `OBJ-(\d+)-`. Extract all integers. Assign max+1, zero-padded to 3 digits. Default `001` if none found. IDs are never reused, even after an objective is dropped.
Slug: title → lowercase → spaces to hyphens → remove non-alphanumeric (except hyphens).
Output path: `oprim/objectives/OBJ-NNN-<slug>.md`

### 2b. Check for custom rules
Read `oprim/config.yaml`. If it has a non-empty `rules.objective` value, treat it as additional guidance from the team — factor it into the questions you ask in step 3 and reflect it in the generated content. If `rules.objective` is absent or empty, skip this step; behavior is unchanged.

### 3. Gather content
Ask: Period (e.g. `2027-Q1` or `2027-H1`), Key results (2–4, each `metric: baseline → target by end of period`), Rationale (why this objective, why this period — cite the PDR or handbook principle it serves, if any).

### 4. Check for supersession
Ask: "Does this supersede an existing objective? If so, which OBJ ID? (Enter to skip)"

### 4b. Check for OKF frontmatter
Read `oprim/templates/objective.md`. If it begins with a YAML frontmatter block (`---` ... `---`), this workspace has OKF frontmatter enabled. Ask for a one-line description and comma-separated tags (subject-area keywords). Prepare a frontmatter block with `type: objective`, `title: <title>`, `description: <description>`, `tags: [<tags>]`, `timestamp: <today's date, ISO 8601>`, `period: <period>`, `status: Active`, to prepend in step 5.
If no frontmatter block is found in the template, skip this step — write the file with no frontmatter.

### 5. Write the objective file
Prepend the frontmatter block from step 4b, if one was prepared.
```
# OBJ-NNN: <title>

## Status
Active

## Period
<period>

## Key results
<key results as bullet list>

## Rationale
<rationale>
```

### 6. Update the superseded objective (if applicable)
Read the superseded file → replace the value under `## Status` with `Superseded by OBJ-NNN` (and its frontmatter `status:`, if it has one) → write back. Do not edit bets that link the old objective — `oprim doctor` reports any bet that now serves no active objective.

### 7. Report what was created
Show the path and remind the user that bets link it with `- Objectives: OBJ-NNN` in their `## Links` section, and products with `<this workspace's remote context name>:OBJ-NNN`.
