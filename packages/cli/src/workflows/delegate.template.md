---
name: oprim-delegate
description: Delegate a portfolio bet to a product workspace with two-way Delegated to/from links — writes the product bet only after confirmation (local products) or a handoff file (git products); never commits or pushes
---

Turn a portfolio bet into a product team's bet without copying it: the portfolio bet keeps only a reference (`- Delegated to: <product>:BET-MMM`), the product bet carries the back-link (`- Delegated from: <portfolio>:BET-NNN`), and from then on the two bets evolve independently. The portfolio never stores the product bet's status — `oprim ovw --portfolio` reads it live, and `oprim validate` checks both links agree.

Usage: `/oprim:delegate <BET-NNN> --to <product>` (and later, for a git product, `/oprim:delegate <BET-NNN> --to <product> --link <BET-MMM>`).

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Hard rules — never break these
- Never write, create or delete anything under `~/.oprim/remote-context-cache/` (or `$OPRIM_REMOTE_CONTEXT_CACHE_DIR`). That cache is reset on every fetch; it is read-only, and it is never the product's real repository.
- Never run `git commit`, `git branch`, `git checkout -b`, `git push` or any other git write in the product's repository — or in this one.
- Never write into a product workspace before the user has explicitly confirmed the exact files and content in step 6.
- Never copy the product bet's status, lane or decision back into a portfolio file.

## Steps

### 1. Check this is a portfolio workspace
Read `oprim/config.yaml`. If `mode:` is not `portfolio`, stop: "Delegation runs from a portfolio workspace (`oprim init --mode portfolio`)."

### 2. Resolve the portfolio bet
Parse `<BET-NNN>` from the arguments (accept `BET-4`, `bet-004`, `4` → `BET-004`). Find `oprim/bets/pending/BET-NNN-*/bet-decision.md`. If it is missing (or only archived), stop and say so. If no ID was given, list the pending bets and ask which one.

### 3. Resolve the product
Parse `--to <product>`; if absent, list the `products:` entries in `oprim/config.yaml` (skip `status: sunset`) and ask which one.
- `<product>` must be a `products:` entry's `source`, and that name must exist under `remote_context.sources`. Otherwise stop and suggest `oprim context register` plus a `products:` entry.
- Read that source entry **from `oprim/config.yaml` yourself**:
  - `path:` → a **local product**. Resolve the path relative to this project root. This directory is the only place you may write (step 6).
  - `git:` → a **git product**. You will write a handoff file in this workspace only (step 7). To read its bets, use `oprim context --source <product>`; never use the cache path as a write target.
- If the portfolio bet's `## Links` already has `- Delegated to: <product>:BET-MMM` for this product, stop: it is already delegated there (a bet may be delegated to several *different* products). If it has `<product>:pending-handoff` and `--link` was not given, remind the user to pass `--link <BET-MMM>` once the product has applied the handoff, and stop.

### 3b. `--link <BET-MMM>` follow-up (git products, after the handoff was applied)
Only when `--link` is given:
1. Read the product bet via `oprim context --source <product>` and confirm `BET-MMM` exists and its `## Links` has `- Delegated from: <qualifier>:BET-NNN` naming this portfolio bet. If it is missing or names another bet, tell the user exactly what the product bet says and stop without changing anything.
2. In the portfolio bet's `## Links`, replace `- Delegated to: <product>:pending-handoff` with `- Delegated to: <product>:BET-MMM` (or add the line if absent). Change nothing else.
3. Suggest deleting `outputs/handoffs/<product>-BET-NNN.md`, which has served its purpose. Stop here.

### 4. Work out the product's IDs and qualifier
- **Product bet ID:** scan the product's `oprim/bets/pending/` and `oprim/bets/archived/` for directories matching `BET-(\d+)(-[^/]*)?` — the same rule as `oprim-bet` — and take max+1, zero-padded to 3 digits (`001` if none). For a git product, read these from `oprim context --source <product>` and mark the ID as *proposed*: the product team assigns the final ID when they apply the handoff.
- **Portfolio qualifier:** the back-link must use the name *the product* registered this portfolio under. Read the product's `oprim/config.yaml` `remote_context.sources` and find the entry pointing at this workspace (a `path:` that resolves here, or a `git:` URL for this repo). If none exists, use this workspace's identity name from `.oprim-context/context.yaml` and tell the user the product must register the portfolio under that name (`oprim context register … --name <name>`) for the link to validate.

### 5. Draft the product bet
Propose from the portfolio bet, then let the user edit each:
- **Title** (re-check the `oprim-bet` naming rule: verb + object [for context]).
- **Why now**, **Expected outcomes**, **Kill criteria / rollback trigger**.
- **Objectives:** the portfolio bet's objectives, qualified to the portfolio — `OBJ-003` becomes `<qualifier>:OBJ-003`.

Ask fresh, because the product owns them: **Owner**, **Review date**, **Decision** (default `Defer` — the product team decides whether to build), **Door type** and the four **risk** levels with rationale.

Slug: as `oprim-bet` (lowercase, non-alphanumerics → `-`, collapse, trim, max 40 chars at a hyphen boundary).

The draft uses the `oprim-bet` bet-decision layout, with these `## Links`:
```
## Links
- PDRs: None
- Objectives: <qualifier>:OBJ-NNN[, …] or None
- Delegated from: <qualifier>:BET-NNN
- OpenSpec change: <to be filled when promoted>
```
and this backlog entry for the product's `oprim/sequence.yaml`:
```yaml
- title: "<title>"
  id: BET-MMM
  blocked_by: []
  unlocks: []
  requires_pdrs: []
```

### 6. Local product — confirm, then write
1. Re-scan the product's `oprim/bets/{pending,archived}/` immediately before confirming (another session may have created a bet) and recompute `BET-MMM` if needed.
2. Show the user, in full: the target path `<product path>/oprim/bets/pending/BET-MMM-<slug>/bet-decision.md`, the complete file content, the backlog entry, and the one line that will be added to the portfolio bet (`- Delegated to: <product>:BET-MMM`).
3. Ask: "Write these files to <product>? (y/N)". Anything other than an explicit yes means **no**: write nothing anywhere, change nothing in the portfolio bet, and stop.
4. On yes, and only then:
   - create `<product path>/oprim/bets/pending/BET-MMM-<slug>/bet-decision.md`;
   - append the backlog entry to `<product path>/oprim/sequence.yaml` (read → parse → append to `backlog` → write back, 2-space indentation; if the file does not exist, stop before writing anything and tell the user to run `oprim init` in the product);
   - add `- Delegated to: <product>:BET-MMM` to the portfolio bet's `## Links` (above `- OpenSpec change:`), keeping any existing `Delegated to:` lines for other products.
5. Do not stage, commit or push in the product repository — tell the user the product team reviews and commits the change themselves.

### 7. Git product — write a handoff file only
Write `outputs/handoffs/<product>-BET-NNN.md` in **this** workspace (create `outputs/handoffs/` if needed). `outputs/` is personal and never exported through remote context. Content:
```
# Handoff: <portfolio BET-NNN title> → <product>

<2–4 sentence note to the product owner: what the portfolio is asking for, the objective it serves, and that the team owns the decision, owner, review date and risks.>

## 1. Create oprim/bets/pending/BET-MMM-<slug>/bet-decision.md
(BET-MMM is proposed — use your next free ID if it is taken.)

<the complete bet-decision.md from step 5, including "- Delegated from: <qualifier>:BET-NNN">

## 2. Append to oprim/sequence.yaml backlog
<the YAML backlog entry>

## 3. Tell the portfolio
Once committed, the portfolio PM runs:
/oprim:delegate BET-NNN --to <product> --link <your BET ID>
```
Then add `- Delegated to: <product>:pending-handoff` to the portfolio bet's `## Links`. Write nothing else — no clone, branch, patch, commit or push.

### 8. Report
Say what was written and where. For a local product, remind the user the product team should review and commit it, and that `oprim validate` now checks the pair. For a git product, give the handoff file path and the `--link` command to run later. Suggest `oprim ovw --portfolio` to see the delegated bet's live status.
