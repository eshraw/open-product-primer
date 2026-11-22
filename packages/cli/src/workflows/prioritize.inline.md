### Prioritize (oprim-prioritize)
Rank pending bets and propose a portfolio board order. Portfolio mode only. **Never write, edit or create any `sequence.yaml`** (portfolio or product); product changes are suggestions to that product's owner.

1. Read `oprim ovw --portfolio --json`, the portfolio's `oprim/sequence.yaml` and pending bet decisions, product bet decisions via `oprim context --source <product>`, `oprim/objectives/` (only Active objectives count) and `products:` owners.
2. Ask what to weigh most: Objective fit (recommended), Lowest risk first, Reversible first, Balanced.
3. Per bet show its inputs: objectives (Active?), risk letters `V/U/F/B = H/M/L`, door type, blockers.
4. Reply with: a ranking table with a one-line rationale per bet; a proposed ```diff``` against the portfolio `oprim/sequence.yaml` only (or "No change proposed"), labelled as not applied; suggestions addressed to product owners.
5. Only if asked, save the proposal to `outputs/<YYYY-MM-DD>-prioritize.md`.
