---
name: oprim-ingest
description: Update wiki/ from a meeting note and propose destinations for the decisions in it
---

Turn a meeting note into wiki updates and decision proposals. The wiki is append-only, and nothing outside `wiki/` is written without confirmation.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Steps

### 1. Read the meeting note
Use the path the user passed (e.g. `/oprim:ingest meetings/2026-11-21-checkout-sync.md`); if none, ask for it. Read it in full. Take the meeting date from the file name or its content; fall back to today.

Also read `products:` from `oprim/config.yaml` and the file names in `wiki/people/`, `wiki/products/` and `wiki/decisions/`, so you reuse existing page names instead of creating near-duplicates.

### 2. Extract
From the note, list:
- **People** mentioned and what is new about each (role, concerns, commitments)
- **Products** discussed and what changed or was learned about each
- **Decisions** made or proposed (one line each, with who decided)
- **Action items** (owner, what, when)

### 3. Append to the wiki — append-only
Every wiki write is an append. Never edit, reorder or delete an existing line in any `wiki/` file.
- `wiki/log.md`: append `## <YYYY-MM-DD> <meeting title>` followed by a 3–6 bullet summary and a `Source: <note path>` line.
- `wiki/people/<name>.md` (kebab-case name; create with a `# <Name>` heading if missing): append `- <YYYY-MM-DD> <what is new> (<meeting title>)` for each person with something new.
- `wiki/products/<product>.md` (create with a `# <product>` heading if missing): append dated bullets for each product discussed.
- `wiki/decisions/<YYYY-MM-DD>-<slug>.md` for each decision: create it if missing with the decision, who decided, context and source; if it exists, append a dated update.

Show the list of wiki files you appended to before moving on.

### 4. Propose a destination for each decision
For each extracted decision, propose exactly one destination and ask the user to confirm or change it (one question per decision):
- **Wiki log only** — nothing further
- **Portfolio PDR candidate** — draft a PDR in this workspace via the `oprim-pdr` workflow
- **Product PDR candidate** — a PDR in a named product's workspace
- **Note candidate** — a NOTE in this workspace or a named product
- **Bet candidate** — a bet in this workspace or a named product

Recommend the most fitting option first. Nothing outside `wiki/` is written until the user confirms the destination.

### 5. Writes into a product need a second confirmation
For a destination in a product workspace: if the product has a local `path:`, show the exact target path and content and ask a separate confirmation before writing anything there. If it is a git source (or has no local path), do not write into it — append the candidate to `outputs/handoffs/<product>.md` (`- <YYYY-MM-DD> <PDR|NOTE|bet> candidate: <decision> (from <note path>)`).

### 6. Action items and report
Offer to add action items owned by the user under `## In progress` in `STATE.md` (one question for all of them). Report: wiki files appended to, each decision's destination, and anything left pending. Append `- <YYYY-MM-DD> /oprim:ingest <note path>` under `## Last commands` in `STATE.md`.
