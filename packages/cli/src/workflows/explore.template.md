---
name: oprim-explore
description: Investigate a problem and compare candidate framings before a bet is drafted
---

Investigate a problem or opportunity and compare candidate framings, before any decision artifact is written. This is oprim's think-first phase — it sits upstream of `/oprim:bet`, not in place of it.

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## What you're doing

Explore is read-only and non-committal: it never writes a `bet-decision.md`. Use it when you've noticed a problem or opportunity but haven't yet converged on what to build, or when there are multiple plausible approaches worth weighing before committing to one. Once a candidate framing is worth committing to, hand off to `/oprim:bet` to draft the decision artifact — that boundary is deliberate, so explore doesn't duplicate `oprim-bet`'s job or drift into writing decisions itself.

## Steps

### 1. Get the problem or opportunity
If not provided, ask: "What problem or opportunity do you want to explore? (a sentence or two)"

### 2. Surface related PDRs
Scan `oprim/decisions/` for files matching `PDR-*.md`. If the directory is empty or missing, skip this step. Otherwise, extract 3–10 keywords from the problem statement (subject-area nouns, capability names, bet IDs). For each PDR file, read the filename and first 25 lines; a PDR is relevant if any keyword appears in its filename, title, or body (case-insensitive). List matches:

**Related product decisions:**
- PDR-NNN: <title> — <Status> (`oprim/decisions/PDR-NNN-<slug>.md`)

If none match, state that plainly and continue.

### 3. Surface related notes
Scan `oprim/notes/` for files matching `NOTE-*.md`. Using the same keywords from step 2, list notes whose title or body mention them:

**Related notes:**
- NOTE-NNN: <title> (`oprim/notes/NOTE-NNN-<slug>.md`)

If `oprim/notes/` is empty or missing, or nothing matches, state that plainly and continue.

### 4. Surface related bets
Scan `oprim/bets/pending/` and `oprim/bets/archived/` for `bet-decision.md` files whose title or `## Why now` section mentions the keywords from step 2. List matches, noting whether each is pending or archived:

**Related bets:**
- BET-NNN: <title> — <pending/archived> (`oprim/bets/<pending|archived>/BET-NNN.../bet-decision.md`)

An archived match with a similar problem statement is worth flagging explicitly — it may mean this ground has been covered before.

### 5. Gather candidate framings
Ask: "What are the candidate approaches or framings worth comparing? (list as many as you'd like — one is fine if you already have a clear direction)"

For each candidate, ask for:
- A one-line description
- The main tradeoff or risk (what makes this candidate weaker than the alternatives, or what's uncertain about it)

### 6. Compare candidates
Present the candidates side by side (name, description, main tradeoff). Do not recommend one over another unless asked — the point of explore is to lay out the comparison clearly, not to decide for the user.

### 7. Report and hand off
Summarize what was surfaced (PDRs, notes, bets, candidate comparison). If the user has converged on a candidate worth committing to, tell them to run `/oprim:bet` to draft the decision artifact — explore does not create one itself. If no candidate has converged yet, note that explicitly and suggest gathering more information before drafting a bet.
