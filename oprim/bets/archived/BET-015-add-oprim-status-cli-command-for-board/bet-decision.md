# Decision: BET-015 Add oprim ovw CLI command for board visibility and sequencing guidance
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — developers are already asking for this; the problem (no terminal board view) is confirmed
- **Usability risk**: Low — CLI with labelled lane output and inline nudges follows familiar patterns
- **Feasibility risk**: Low — js-yaml and chalk are already dependencies; follows existing command patterns in the codebase
- **Business viability risk**: Low — internal tool, no monetization surface, no breaking change to existing workflow

## Why now
- Viewing board state via an agent skill consumes tokens for a read-only, zero-reasoning operation
- Board status and sequencing recommendations are product decisions rooted in the owner's vision — a CLI command renders them deterministically, while an agent response introduces variability that undermines that intent
- The "opinion" on board state belongs to the product owner, not the agent; the CLI is the right vehicle for expressing that
- No way to see board state without an LLM call or manually opening sequence.yaml
- PM and UX analysis both flagged this as the #1 gap for 1.0.0
- Developers need a fast "what's happening" command at the terminal
- The CLI has 5 commands; none of them surfaces the current state of work

## Alternatives considered
- Agent skill only (current) — wastes tokens on a display task that needs no reasoning; wrong tool for the job
- `oprim doctor` extension — doctor validates health, not board state; conflates two concerns
- Read sequence.yaml directly — works but requires knowing the file format and location

## Expected outcomes
- Developers can answer "what are my bets and where do they stand?" in under 5 seconds
- Board visibility increases bet-to-archive completion rate
- Users are guided toward better sequencing decisions (2-way before 1-way, risk awareness)

## Kill criteria / rollback trigger
- Usage is consistently low relative to agent skill invocations — suggests CLI view isn't the preferred entry point

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/bet-015-add-oprim-ovw-cli-cmd/`
