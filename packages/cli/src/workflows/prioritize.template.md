---
name: oprim-prioritize
description: Rank pending bets by objective fit, risk profile and door type and propose a portfolio sequence.yaml diff — proposes only, never edits any board
---

Rank the bets in flight across the portfolio and its products, and propose — never apply — a new order for the portfolio board. The board is the owner's opinion: this workflow shows its reasoning per bet so the PM can disagree line by line, and the PM applies any change themselves (or via `/oprim:sequence`).

**Interactive prompts:** Use the **AskUserQuestion tool** for every question in this skill — do not write questions as plain text.

## Hard rules — never break these
- **Never write, edit or create any `sequence.yaml`** — not the portfolio's `oprim/sequence.yaml`, and never a product's. This workflow is read-only on every board.
- Never write into a product workspace or under `~/.oprim/remote-context-cache/`.
- Changes to a product's board are **suggestions addressed to that product's owner**, never a diff to their file.
- Do not compute a hidden score. Every rank shows its inputs.

## Steps

### 1. Check this is a portfolio workspace
Read `oprim/config.yaml`. If `mode:` is not `portfolio`, stop: "Prioritization runs from a portfolio workspace (`oprim init --mode portfolio`)."

### 2. Gather inputs (read-only)
- Run `oprim ovw --portfolio --json` from the project root: each board's `now`/`next` lanes and load, `dependencies`, `delegations`, `coverage` (objectives without a bet in flight, bets without an objective) and `hygiene`.
- Read the portfolio's `oprim/sequence.yaml` (all lanes, including `later`/`backlog`) and every `oprim/bets/pending/*/bet-decision.md`.
- For each product bet that appears on a board, read its `bet-decision.md` via `oprim context --source <product>` — never from the cache path directly.
- Read `oprim/objectives/OBJ-*.md` and note each objective's status; only **Active** objectives count toward fit.
- Read `products:` in `oprim/config.yaml` for each product's `owner` (for addressing suggestions) and `status` (skip `sunset`).

### 3. Ask what to weigh
Ask one question: "What should weigh most this time?" with options **Objective fit** (recommended), **Lowest risk first**, **Reversible bets first (2-way doors)**, **Balanced**. Use the answer to break ties — it never hides an input.

### 4. Rank
For each pending bet (portfolio bets by plain ID; product bets as `<product>:BET-NNN`), collect:
- **Objectives** — the `- Objectives:` line in `## Links`, marking each as Active / not Active / unknown. A bet serving no Active objective is ranked low and says so.
- **Risk letters** — the four `## Risk profile` levels as `V/U/F/B = H/M/L` (e.g. `V:M U:L F:L B:M`).
- **Door** — `2-way` or `1-way` from `## Door type`. A 1-way door with High risk needs stronger objective fit to rank high.
- **Blockers** — unresolved or out-of-order `blocked_by` from the view's `dependencies`.

### 5. Output — ranking, portfolio diff, product suggestions
Reply with three sections, and nothing else changes on disk:

**Ranking** — a table, highest first:

| # | Bet | Objectives | Risk | Door | Lane now | Rationale |
|---|-----|------------|------|------|----------|-----------|

Each rationale is one line naming the input that decided the position.

**Proposed portfolio `sequence.yaml` diff** — a fenced ```` ```diff ```` block against `oprim/sequence.yaml` moving only portfolio bets between lanes, respecting `wip_limits` from `oprim/config.yaml`. If no move is warranted, say "No change proposed." State plainly: "This is a proposal — nothing was written. Apply it yourself or with `/oprim:sequence`."

**Suggestions for product owners** — one bullet per product bet whose lane looks wrong, addressed to the owner, e.g. "To <owner> (`checkout`): `checkout:BET-031` sits in Now but serves no Active objective — consider moving it to Next or linking an objective." Never phrase these as a diff.

### 6. Offer the next step
Ask whether to save the proposal to `outputs/<YYYY-MM-DD>-prioritize.md` (personal, never exported). Write only that file, and only on yes.
