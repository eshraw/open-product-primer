## Context

The `oprim-bet` skill currently accepts any title string without validation or guidance. As the bet backlog grows, opaque one-word or ambiguous titles (e.g., "Auth", "Refactor DB") make the sequencing board hard to scan. The fix is in the skill itself—at title-entry time—so the cost is paid once and all future bets benefit.

## Goals / Non-Goals

**Goals:**
- `oprim-bet` shows a naming convention example before prompting for the title
- Titles that are too short (under ~5 words or 30 characters) receive a warning with a suggested reformulation
- The scaffolded `bet-decision.md` template includes an inline naming tip

**Non-Goals:**
- Retroactively renaming existing bets in `sequence.yaml` or file system
- Enforcing a rigid format (hard reject) — guidance + soft warning is sufficient
- Auto-generating titles from the rationale (LLM-assisted rename is a separate bet)

## Decisions

**Soft validation over hard rejection**
A warning with an example is shown, but the user can proceed with any title. Hard rejecting short titles would add friction without meaningful benefit — "Fix bug" is a bad title but not worth blocking on.

**Convention format: `<verb> <object> [for <context>]`**
Examples: "Improve bet naming for scannability", "Add criteria contracts to bet promotion", "Remove legacy init migration path". This pattern is specific enough to scan and flexible enough to cover most bets.

**Validation threshold: fewer than 4 words OR fewer than 25 characters**
Simple, deterministic, no external dependencies. Catches the most common offenders ("Auth", "Refactor", "Fix naming") without false positives on legitimate short titles.

## Risks / Trade-offs

- [Mild friction at creation time] → Mitigated by soft warning; user can always proceed
- [Convention may not fit all bets] → The `[for <context>]` part is optional; the pattern is a guide, not a template
- [Future bets may still have bad names if user dismisses warning] → Accepted; habit forms over time

## Migration Plan

- Update the `oprim-bet` skill to include naming guidance and soft validation
- Update the `bet-decision.md` template with an inline naming tip comment
- No data migration required — existing bets are out of scope
