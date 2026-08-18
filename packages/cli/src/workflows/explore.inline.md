### Problem exploration (oprim-explore)
Investigate a problem or opportunity and compare candidate framings, before any decision artifact is written. Read-only and non-committal — never writes a `bet-decision.md`.

1. Ask for the problem or opportunity (a sentence or two).
2. Surface related PDRs: scan `oprim/decisions/PDR-*.md`, extract keywords from the problem statement, list matches by filename/title/body relevance.
3. Surface related notes: scan `oprim/notes/NOTE-*.md` the same way.
4. Surface related bets: scan `oprim/bets/pending/` and `oprim/bets/archived/` for bet-decisions with similar titles or "Why now" content — flag archived matches explicitly, since they may mean this ground has been covered before.
5. Ask for candidate approaches/framings (description + main tradeoff each) and present them side by side without recommending one, unless asked.
6. Report what was surfaced and, if the user has converged on a candidate, tell them to run `/oprim:bet` to draft the decision — explore does not create the bet itself.
