---
name: oprim-context-init
description: Guide the user through drafting a description before declaring the current project a citable remote context
---

Declare the current project a citable remote context, with a clear description other projects and agents can use to decide whether to pull it.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## What this does

A remote context is an oprim workspace (decisions, bets, specs) that other projects can reference read-only via `oprim context register`. Without a description, other projects have no cheap way to know what a remote context covers short of fully pulling it — so this skill exists to make sure one gets written.

## Steps

### 1. Check for an existing identity
Check whether `.oprim-context/context.yaml` already exists in the current project. If it does, report that a remote context identity already exists (do not re-run the drafting flow below) and stop.

### 2. Ask what this workspace covers
Ask the user, one at a time:
- "What does this project's oprim workspace cover? (e.g. product decisions, a specific domain, a team's specs)"
- "Who is this meant for — which teams or projects would reference it?"

If the user declines to answer either question, treat that as opting out of guided drafting — skip to step 4 with no description.

### 3. Draft and confirm the description
From the answers, draft a single-sentence description (aim for under 120 characters — this is what `oprim context list` will show other projects). Show the draft to the user and ask: "Use this description? (Enter to accept, or type a replacement)"

### 4. Call oprim context init
- If a description was drafted or accepted: use the Bash tool to run `oprim context init --description "<final text>"`.
- If the user opted out in step 2: warn clearly that the resulting remote context will show as description-less in `oprim context list`, then use the Bash tool to run `oprim context init` with no `--description` flag.

### 5. Report what was created
Report the path (`.oprim-context/context.yaml`) and the description that was set (or the description-less warning, if opted out).
