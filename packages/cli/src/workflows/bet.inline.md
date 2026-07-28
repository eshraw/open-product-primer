### Bet authoring (oprim-bet)
Create a new bet in `oprim/bets/pending/` and register it on the sequencing board.

1. Show naming tip: "verb + object [for context] — e.g. 'Improve bet naming for scannability'"
2. Ask for the bet title. Validate: fewer than 4 words OR fewer than 25 chars → warn, suggest reformulation, ask "Proceed anyway? (y/N)".
3. Assign next BET ID: scan `oprim/bets/pending/BET-(\d+)` and `oprim/bets/archived/BET-(\d+)` dirs, max+1 zero-padded to 3 digits (default 001).
4. Check `oprim/sequence.yaml` exists — stop if not, advise `oprim init`.
4b. Read `oprim/config.yaml`'s `rules.bet` — if non-empty, apply it as additional guidance and reflect it in the generated content; if empty, behavior is unchanged.
5. Gather: decision (default Build now), owner, review date (YYYY-MM-DD), why now, alternatives, expected outcomes, kill criteria, PDR links.
6. Write `oprim/bets/pending/BET-NNN/bet-decision.md` with all fields.
7. Append to `oprim/sequence.yaml` backlog: `{id, title, blocked_by: [], unlocks: [], requires_pdrs: []}`.
8. Ask: "Scaffold a discovery.md now? (y/N)" — if "y", write `oprim/bets/pending/BET-NNN/discovery.md`.
9. Report what was created.