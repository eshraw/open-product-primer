### Delegation (oprim-delegate)
Delegate a portfolio bet to a product: `/oprim:delegate <BET-NNN> --to <product> [--link <BET-MMM>]`. Portfolio mode only.

Never write under `~/.oprim/remote-context-cache/`, never run git commit/branch/push, never write to a product before explicit confirmation, never copy product status back.

1. Resolve the pending portfolio bet and the product (`products:` entry → `remote_context.sources`; read the source from `oprim/config.yaml` yourself). `path:` = local product (writable after confirmation); `git:` = git product (handoff file only).
2. `--link BET-MMM` (git follow-up): confirm the product bet has `- Delegated from: <qualifier>:BET-NNN`, then replace `<product>:pending-handoff` with `<product>:BET-MMM` in the portfolio bet's `## Links`, and stop.
3. Product bet ID: max+1 over the product's `oprim/bets/{pending,archived}/` (as oprim-bet). Qualifier: the name the product registered this portfolio under (else this workspace's identity name).
4. Draft from the portfolio bet (title, why now, outcomes, kill criteria, objectives qualified to the portfolio); ask Owner, Review date, Decision (default Defer), door type and risks fresh. Links: `- Delegated from: <qualifier>:BET-NNN`. Backlog entry for the product's `sequence.yaml`.
5. Local: re-scan IDs, show path + full content + backlog entry + the portfolio line, ask "Write these files to <product>? (y/N)". Only on yes: write the bet, append the backlog entry, add `- Delegated to: <product>:BET-MMM` to the portfolio bet. No commit.
6. Git: write `outputs/handoffs/<product>-BET-NNN.md` (note to owner, full bet-decision, backlog entry, the `--link` command) and add `- Delegated to: <product>:pending-handoff`. Nothing else.
7. Report what was written; `oprim validate` checks both links, `oprim ovw --portfolio` shows live status.
