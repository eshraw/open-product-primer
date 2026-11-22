# Decision: BET-078 Delegate portfolio bets to product workspaces with two-way links
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2027-01-15

## Door type
- [ ] 2-way door (reversible — safe to try, easy to undo)
- [x] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — the core PM handoff ("this cross-product bet becomes checkout's bet"), but product owners may prefer to write their own bet rather than receive one.
- **Usability risk**: Medium — two paths (local write vs git handoff file) with different outcomes; the user must understand which applies.
- **Feasibility risk**: Medium — writing into another repo (ID assignment, `sequence.yaml` append) must be exactly as correct as `oprim-bet`, and never touch the remote-context cache.
- **Business viability risk**: Medium — writing into a team's repo is a trust boundary; a wrong or unconfirmed write damages the PM–team relationship.

## Why now
- Without delegation the portfolio can only *observe* products; delegation is what turns a portfolio bet into product work while keeping PDR-001's "reference, never copy" rule.
- Depends on the reference syntax (BET-076) for both back-links and on objectives (BET-077) so a delegated bet carries its OKR link across.

## Alternatives considered
- Ask the product owner to create the bet by hand and link it manually — kept as the fallback for git products (handoff file), but too lossy as the only path.
- Patch file or branch in a local clone for git products — rejected in PDR-001 (stale patches, blast radius, the only clone is the read-only cache).
- Copy the delegated bet's status back into the portfolio bet on each run — rejected: status is read at resolution time, never stored.

## Expected outcomes
- `/oprim:delegate BET-NNN --to <product>` on a local-path product writes the linked product bet + backlog entry only after explicit confirmation; on a git product writes `outputs/handoffs/<product>-BET-NNN.md` and nothing else.
- Portfolio bet gets `- Delegated to: <product>:BET-MMM`; product bet gets `- Delegated from: <portfolio>:BET-NNN`.
- `validate` fails (required) when a delegated pair exists on only one side or back-links disagree; a pending handoff is reported as pending, not as a failure.
- `ovw --portfolio` shows the delegated bet's live lane/status, read from the product.

## Kill criteria / rollback trigger
- In dogfooding, ≥ 1 delegation writes to a product without a confirmation prompt, or writes anywhere under `~/.oprim/remote-context-cache/` → disable the local-write path and ship handoff-file-only.
- Product owners reject or rewrite > half of delegated bets → downgrade delegation to handoff-file-only for all products.

## Links
- PDRs: PDR-001
- Objectives: None
- OpenSpec change: <to be filled when promoted>
