# Decision: BET-015 Add oprim status CLI command for terminal board visibility
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- No way to see board state without an LLM call or manually opening sequence.yaml
- PM and UX analysis both flagged this as the #1 gap for 1.0.0
- Developers need a fast "what's happening" command at the terminal
- The CLI has 5 commands; none of them surfaces the current state of work

## Alternatives considered
- Agent skill only (current) — requires an LLM call just to answer "what are my bets?"
- `oprim doctor` extension — doctor validates health, not board state; conflates two concerns
- Read sequence.yaml directly — works but requires knowing the file format and location

## Expected outcomes
- Developers can answer "what are my bets and where do they stand?" in under 5 seconds
- Board visibility increases bet-to-archive completion rate

## Kill criteria / rollback trigger
- Usage is consistently low relative to agent skill invocations — suggests CLI view isn't the preferred entry point

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
