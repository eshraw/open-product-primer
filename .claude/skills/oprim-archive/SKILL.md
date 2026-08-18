---
name: oprim-archive
description: Archive a completed bet — moves it to oprim/bets/archived/, removes its sequence.yaml entry, and folds any spec deltas under its specs/ directory into oprim/specs/ current truth
---

## Step 0: Check relevant product decisions
Invoke the `oprim:context` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or `oprim/decisions/` is empty, the skill exits silently — continue to Step 1 immediately.

Archive a completed bet by moving it to `oprim/bets/archived/`, removing it from `sequence.yaml`, and (if present) merging its spec deltas into current truth.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Get the bet ID

If provided as an argument (e.g., `/oprim:archive BET-005`), use it directly.

If not provided, ask: "Which bet ID would you like to archive? (e.g., BET-005)"

Normalize the input: accept `bet-005`, `005`, `5`, or `BET-005` — always treat as `BET-NNN` zero-padded to 3 digits.

### 2. Resolve the bet directory

Look for the bet directory in `oprim/bets/pending/` using two patterns:
1. Exact match: `oprim/bets/pending/BET-NNN/` (legacy non-slug format)
2. Slug variant: any directory starting with `BET-NNN-` (e.g., `BET-NNN-<slug>/`)

Use whichever pattern matches. Call this the **resolved directory name**.

If multiple directories match (e.g., both `BET-NNN/` and `BET-NNN-slug/` exist):
- Report: "Ambiguous: found multiple directories for BET-NNN: [list them]. Please archive manually."
- Stop.

If neither pattern matches:
- Report: "Bet BET-NNN was not found in oprim/bets/pending/. Nothing was changed."
- Stop.

### 3. Check for active dependencies, concurrent spec-delta conflicts, and incomplete tasks.md

Read `oprim/sequence.yaml`. Scan every entry across all buckets (now, next, later, backlog) for any entry whose `blocked_by` or `unlocks` list contains the target bet ID.

Separately, if `oprim/bets/pending/<resolved-dir>/specs/` exists: for each `<capability>/spec.md` delta file under it, extract every `### Requirement:` header from its `## ADDED`/`## MODIFIED`/`## REMOVED Requirements` sections. Then scan every other bet directory directly under `oprim/bets/pending/` (excluding the bet being archived) for a `specs/<capability>/spec.md` file for the same capability; if one exists, extract its `### Requirement:` headers too. Flag any header that matches (whitespace-insensitive) between the archiving bet's delta and another still-active bet's delta as an **overlap**.

Separately, if `oprim/bets/pending/<resolved-dir>/tasks.md` exists: count the number of unchecked `- [ ]` items in it. If one or more remain, flag this as an **incomplete-tasks warning**. If `tasks.md` doesn't exist, or every item is checked (`- [x]`), this contributes nothing to the warning.

If any of sequence.yaml dependents, delta overlaps, or an incomplete tasks.md are found:
- Show a combined warning listing each dependent entry, each overlapping requirement, and (if applicable) the incomplete-tasks count.

  Example:
  ```
  ⚠ Warning: BET-005 is referenced by active bets:
    - BET-007 (blocked_by: [BET-005])
    - BET-008 (unlocks: [BET-005])
  ⚠ Warning: BET-005's delta for requirement "The system SHALL ..." in capability foo overlaps with active bet BET-009's delta for the same requirement. Archiving BET-005 now applies its version to oprim/specs/foo/spec.md; if BET-009 archives later, its version will overwrite this requirement again (last-write-wins — no 3-way merge is attempted).
  ⚠ Warning: BET-005's tasks.md has 3 unchecked item(s) — implementation may be incomplete.
  ```
- Ask: "Archive BET-NNN anyway? (y/N)"
  - If "n" or Enter: stop, no changes made.
  - If "y": proceed.

If none are found: proceed without warning.

### 4. Fold spec deltas into current truth

If `oprim/bets/pending/<resolved-dir>/specs/` does not exist: skip this step entirely and go to Step 5 — archive behavior is unchanged from before spec deltas existed.

Otherwise, for each capability subdirectory under `oprim/bets/pending/<resolved-dir>/specs/` containing a `spec.md`:

1. Read the delta file's `## ADDED Requirements` / `## MODIFIED Requirements` / `## REMOVED Requirements` sections. Each `### Requirement:` block runs from its header through its body and any `#### Scenario:` sub-entries, up to the next `### Requirement:` or `## ` header.
2. Read `oprim/specs/<capability>/spec.md` if it exists (current truth uses a single flat `## Requirements` section).
   - **If it does not exist:**
     - If the delta is entirely `## ADDED Requirements` (no MODIFIED/REMOVED sections): create `oprim/specs/<capability>/spec.md` with a `## Requirements` header and append each ADDED requirement block beneath it.
     - If the delta contains any MODIFIED or REMOVED requirements: stop before moving anything and report an error — "cannot modify/remove requirement '<header>' in capability <capability> — no current-truth spec exists yet for this capability."
   - **If it does exist:**
     - **ADDED**: append the requirement block to the end of the `## Requirements` section.
     - **MODIFIED**: find the existing `### Requirement:` block whose header text matches the delta's (whitespace-insensitive); replace that entire block (header, body, and scenarios) with the delta's version. If no match is found, treat it as ADDED instead (append) and note this in the final report.
     - **REMOVED**: find and delete the matching block entirely. If no match is found, note this in the final report and continue — nothing to remove.
3. Write the updated `oprim/specs/<capability>/spec.md`.

This fold always overwrites the matched requirement wholesale — it never reconciles two bets' overlapping changes. If a later bet's archive touches the same requirement again, its version simply replaces this one (last-write-wins, confirmed by construction — no 3-way merge).

Track which capabilities were merged (and any no-match notes) for the final report.

### 5. Move the bet directory to archive

Create the archive subfolder if it doesn't exist:
```bash
mkdir -p oprim/bets/archived
```

Move the resolved directory:
```bash
mv oprim/bets/pending/<resolved-dir> oprim/bets/archived/<resolved-dir>
```

### 6. Remove the bet entry from sequence.yaml

Read `oprim/sequence.yaml`, parse it, and remove the entry with `id: BET-NNN` from whichever bucket it appears in (now, next, later, or backlog). Write the updated YAML back using 2-space indentation. Do not modify any other entries.

### 7. Report what was done

```
## Bet Archived

**Bet:** BET-NNN
**Archived to:** oprim/bets/archived/<resolved-dir>/
**Removed from sequence.yaml:** ✓
**Spec deltas merged:** <capability-1>, <capability-2> (omit this line if no specs/ directory was present)

The bet is preserved in full at the archive location.
```
