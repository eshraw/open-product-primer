# Decision: BET-018 Improve new user onboarding from first contact to first bet
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-06-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
Two distinct drop-off points make the current first experience too leaky to ignore:

**Loss 1 — pre-init (README):** The README explains oprim's structure but not its value. A developer who doesn't already know Shape Up / product methodology reads it, doesn't understand what oprim does for them concretely, and never runs init.

**Loss 2 — post-init (conceptual gap):** A developer who does run init is told to "create a bet" with no explanation of what a bet is. Without prior exposure to product methodology, the action stalls. The CLI assumes knowledge the user doesn't have.

Both losses happen in the same session and share the same root cause: oprim introduces its structure before it earns the user's understanding.

## Alternatives considered
- Fix only the CLI (original scope) — misses Loss 1; users who don't pass the README never reach init
- Fix only the README — misses Loss 2; users who do run init still stall at "what is a bet"
- Onboarding wizard in init — too heavyweight; the tool is deliberately lightweight
- Let the agent explain via chat — requires starting an LLM session before the user has seen value; too much friction for cold start

## Expected outcomes
- New users understand what oprim does before running init
- New users who run init create a first bet in the same session, without needing to know product methodology in advance
- The methodology reveals itself through action, not documentation

## Kill criteria / rollback trigger
- Users still stall after first-bet creation — signals the problem is the methodology itself, not the onboarding; scope is wrong
- README changes don't meaningfully reduce pre-init drop-off — pivot to in-tool guidance only

## Links
- PDRs: None
- OpenSpec change: `openspec/changes/bet-018-improve-new-user-onboarding-from-first-contact-to-first-bet/`
