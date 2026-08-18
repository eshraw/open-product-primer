---
name: oprim-spec
description: Generate a native oprim capability spec delta at oprim/bets/pending/BET-NNN-<slug>/specs/<capability>/spec.md while a bet is active, in RFC 2119 (SHALL/SHOULD/MAY) requirements and Gherkin scenarios — folded into oprim/specs/<capability>/spec.md (current truth) when the bet is archived. On the first invocation for a bet, also generates design.md and tasks.md alongside the spec delta.
---

## Step 0: Check relevant product decisions
Invoke the `oprim:context` skill using the Skill tool. If matching PDRs are surfaced, review them before proceeding. If no PDRs match or `oprim/decisions/` is empty, the skill exits silently — continue to Step 1 immediately.

Generate a capability spec delta for an active bet — RFC 2119 requirements plus Gherkin scenarios, no OpenSpec required. This skill never writes to `oprim/specs/` directly; `oprim-archive` folds the delta into current truth when the bet is archived.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Get the active bet
If a bet ID was provided as context (e.g. invoked from `/oprim:promote`), use it directly. Otherwise ask: "Which bet is this spec change for? (e.g. BET-005)"

Resolve it to a directory in `oprim/bets/pending/` using the same two patterns `oprim-archive` uses: exact `BET-NNN/` (legacy, no slug) or the slug variant `BET-NNN-<slug>/`. If neither matches, report "Bet BET-NNN was not found in oprim/bets/pending/ — spec deltas can only be authored against an active bet" and stop.

### 2. Get the capability name and description
If not provided, ask: "What capability are you specifying? (a short name, e.g. 'spec-authoring')" and "What does it do? (one or two sentences)"

### 2b. Derive the slug
From the capability name: lowercase all characters, replace any character that is not a letter or digit with a hyphen, collapse consecutive hyphens to one, strip leading/trailing hyphens. This becomes `<capability>`.
Output path: `oprim/bets/pending/<resolved-bet-dir>/specs/<capability>/spec.md` (a delta, not `oprim/specs/<capability>/spec.md` — that file is current truth and is only ever written by `oprim-archive`'s merge step).

### 2c. Check for custom rules
Read `oprim/config.yaml`. If it has a non-empty `rules.spec` value, treat it as additional guidance from the team — factor it into the requirements and scenarios you draft. If `rules.spec` is absent or empty, skip this step; behavior is unchanged.

### 3. Determine the delta type for each requirement
For each requirement, ask whether it is new (**ADDED**), a change to an existing current-truth requirement (**MODIFIED**), or a removal of one (**REMOVED**).

- **ADDED**: gather the requirement statement fresh.
- **MODIFIED / REMOVED**: read `oprim/specs/<capability>/spec.md` if it exists and list its `### Requirement:` headers so the user can pick the one being changed. The header text must match exactly (whitespace-insensitive) for `oprim-archive`'s merge step to find it later. If the file doesn't exist yet, MODIFIED/REMOVED aren't possible for this capability — fall back to ADDED.

### 4. Gather requirements and scenarios
For ADDED and MODIFIED requirements, phrase each as an RFC 2119 statement using SHALL (mandatory), SHOULD (recommended), or MAY (optional), then ask for at least one scenario: a WHEN (trigger) and a THEN (expected outcome), with an optional GIVEN (context) and additional AND steps. REMOVED requirements only need the matching header — no new scenarios.

### 5. Check for existing design/tasks artifacts
Before writing the spec delta, check whether `design.md` and `tasks.md` already exist in `oprim/bets/pending/<resolved-bet-dir>/`.

- If neither exists, this is the first `oprim-spec` invocation for this bet — continue to Step 6 to draft both before writing the delta.
- If either already exists (from a prior `oprim-spec` invocation for this bet, e.g. for a different capability), skip Step 6 entirely and go straight to Step 7 — only the spec delta is written or appended.

### 6. Draft design.md and tasks.md (first invocation only)
Only performed when Step 5 found neither file yet exists. Write both to `oprim/bets/pending/<resolved-bet-dir>/`:

1. **`design.md`** — the technical approach and trade-offs for the capability being specced: key decisions, alternatives considered, risks. Scope it to this capability's implementation, not the whole bet.
2. **`tasks.md`** — a flat implementation checklist derived from the requirements and scenarios just captured in Step 4. Group tasks under `## N. <heading>` sections (one heading per logical unit of work, e.g. per requirement or component) with `- [ ] N.M <task description>` checkbox items beneath each — the same convention OpenSpec's own `tasks.md` uses, so completion is a simple parse (count of unchecked boxes), not a new format to learn.

### 7. Write the delta file
Append to (or create) `oprim/bets/pending/<resolved-bet-dir>/specs/<capability>/spec.md`, grouping requirements under the matching section header — only include a section if it has at least one requirement under it:

```markdown
## ADDED Requirements

### Requirement: <capability> SHALL/SHOULD/MAY <requirement statement>
<one-sentence elaboration>

#### Scenario: <scenario title>
- **GIVEN** <context> (optional)
- **WHEN** <trigger>
- **THEN** <outcome>
- **AND** <additional outcome> (optional)

## MODIFIED Requirements

### Requirement: <exact header text matched from oprim/specs/<capability>/spec.md>
<revised elaboration>

#### Scenario: <scenario title>
- **WHEN** <trigger>
- **THEN** <outcome>

## REMOVED Requirements

### Requirement: <exact header text matched from oprim/specs/<capability>/spec.md>
```

If the delta file already exists (a prior spec-authoring pass for this bet/capability), append new requirements to the matching section, creating that section if it's not yet present.

### 8. Report what was created
Show the delta file path, which bet it's scoped to, and a summary of the ADDED/MODIFIED/REMOVED requirements captured. Note that it merges into `oprim/specs/<capability>/spec.md` when `BET-NNN` is archived — nothing is current truth yet.

On a first invocation (Step 6 ran), also report the `design.md` and `tasks.md` paths that were created. On a later invocation (Step 6 skipped), note that those two files already existed and were left untouched.
