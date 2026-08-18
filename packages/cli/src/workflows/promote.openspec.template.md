
Promote an atomic note into a bet, or a prioritized bet into a capability spec. The promotion path is determined solely by the prefix of the ID argument — there is no separate command for each.

**Input**: Specify an ID (e.g., `/oprim:promote BET-042` or `/oprim:promote NOTE-005`) or omit to be prompted.

### 0. Determine the promotion path from the ID prefix
- `BET-` → **A. Bet → OpenSpec change**
- `NOTE-` → **B. Note → Bet**
- Anything else → report "Unrecognized ID prefix — expected BET- or NOTE-" and stop. Do not silently do nothing.

## A. Bet → OpenSpec change

1. **Locate the bet** — read `oprim/bets/pending/BET-XXX/bet-decision.md`
2. **Validate status** — decision must be "Build now"
3. **Check authority boundary** — confirm primer artifact owns why/order/outcome only
4. **Create OpenSpec change** — derive the change name as `bet-NNN-<slug>` where `NNN` is the zero-padded bet number (e.g. BET-004 → `bet-004`) and `<slug>` is a short kebab-case summary of the change. Then invoke the `/openspec-propose` skill (or `/opsx:propose`) with that name to create the change directory with **all required artifacts**: `proposal.md`, `design.md`, `tasks.md`, and `specs/<capability>/spec.md` for every capability listed under `## Capabilities`.
   - Pass the bet decision content as context so the proposal reflects the bet's why/outcome
   - **Do not manually create a partial change directory** — the propose skill ensures no artifact is omitted
   - The spec file(s) are mandatory: each capability modified or added must have WHEN/THEN scenarios under `## ADDED Requirements` or `## MODIFIED Requirements`
5. **Link artifacts**:
   - Add OpenSpec change path to bet-decision `## Links` section
   - Add bet ID to OpenSpec proposal `## Context` section
6. **Copy criteria** — if `oprim/bets/pending/BET-XXX/criteria.yaml` exists, link it from OpenSpec proposal
7. **Verify completeness** — confirm the change directory contains:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - `specs/<capability>/spec.md` for each capability in `## Capabilities`
   If any artifact is missing, create it before reporting done.
8. **Report** — show what was linked and what remains for engineering

## B. Note → Bet

1. **Locate the note** — read `oprim/notes/NOTE-XXX-<slug>.md`
2. **Assign the next BET ID** — scan both `oprim/bets/pending/` and `oprim/bets/archived/` for directories matching `BET-(\d+)(-[^/]*)?`, max+1 zero-padded to 3 digits (default 001) — same convention `oprim-bet` uses
3. **Derive the slug** from the note's title (lowercase, non-alphanumeric → hyphen, collapse/trim hyphens, truncate to 40 chars at a hyphen boundary)
4. **Draft the bet** — write `oprim/bets/pending/BET-NNN-<slug>/bet-decision.md` from the standard bet-decision structure, pre-filling only `## Why now` from the note's body. Leave `Alternatives considered`, `Expected outcomes`, and `Kill criteria / rollback trigger` as template placeholders — draft from the note, don't fabricate content it doesn't support. Ask for `Owner` and `Review date`; default `Decision: Build now` and `Date` to today.
5. **Register the new bet** — append to `oprim/sequence.yaml` backlog: `{title, id, blocked_by: [], unlocks: [], requires_pdrs: []}`
6. **Link back** — add `Bets: BET-NNN` to the note (creating or extending its `## Bets` section)
7. **Report** — show the new bet's path and flag that `Alternatives considered`, `Expected outcomes`, and `Kill criteria` still need authoring before this bet can itself be promoted
