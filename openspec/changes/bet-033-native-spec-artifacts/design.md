## Context

`oprim-spec` (native mode) currently produces only a `specs/<capability>/spec.md` delta per bet. OpenSpec-based bets get `proposal.md`/`design.md`/`tasks.md` for free via `/openspec-propose`; native-mode bets have no equivalent for the latter two, so `bet-decision.md` ends up conflating product decision (why/order/outcome — its actual job) with technical design and implementation checklisting, which it was never meant to hold. This is the direct follow-on to BET-032: once bets live under `oprim/bets/pending/`, that split only carries real "build status" meaning if there's something concrete inside a pending bet that shows whether it's actually done.

(`proposal.md` is deliberately excluded from this bet's scope — see Decisions below.)

## Goals / Non-Goals

**Goals:**
- Give native-mode bets an implementation checklist (`tasks.md`) whose completion state is mechanically checkable, not just self-reported
- Reach rough parity with OpenSpec's design/tasks split without requiring OpenSpec itself
- Keep the new artifacts optional-feeling in the same way OpenSpec's are additive to a proposal, not a separate approval gate

**Non-Goals:**
- Not building a task-execution tracker, dependency graph, or per-task assignee/estimate system — `tasks.md` is a flat checkbox list, same as OpenSpec's
- Not hard-blocking `oprim:archive` on incomplete tasks — a soft warning preserves the 2-way-door reversibility both this bet and BET-032 call for
- Not retrofitting design/tasks onto already-archived native bets
- Not generating a `proposal.md` — `bet-decision.md` already covers why-now/expected-outcomes; a native `proposal.md` sourced from that same content would restate it rather than add anything (see Decisions)

## Decisions

- **Extend `oprim-spec` rather than add a new skill**: a new companion skill was considered (per the bet's "Alternatives considered") but rejected — one more skill name for users to learn cuts against native mode's whole reason for existing (avoiding OpenSpec-style ceremony). `oprim-spec` already runs once per bet's first capability; generating the two artifacts on that same first invocation keeps the mental model at "one skill, one bet."
- **Generate once, not on every invocation**: `oprim-spec` checks whether `design.md`/`tasks.md` already exist in the bet directory before writing them; a second `oprim-spec` call for the same bet (e.g., a different capability) only appends/writes the spec delta, not new design/tasks
- **Drop `proposal.md` from scope**: initially planned alongside `design.md`/`tasks.md` for OpenSpec parity, but its content (why/what) was to be sourced verbatim from `bet-decision.md`'s why-now and expected outcomes — the same information restated in a second file, not new content. `design.md` and `tasks.md` each hold information that exists nowhere else (technical trade-offs; a checkable completion signal), so only those two are generated.
- **Soft warning over hard block on archive**: the bet's own risk profile flags the gating mechanism as an open design question; a hard block would make an already-2-way-door workflow feel 1-way if `tasks.md` was drafted loosely. Mirroring the existing `oprim:archive` "referenced by other active bets" confirm-to-proceed pattern keeps the UX consistent and still surfaces the signal
- **`tasks.md` uses OpenSpec's own checkbox convention (`- [ ] N.M description`)** rather than inventing a new syntax, so the parsing logic (count unchecked boxes) is trivial and matches a format contributors may already know from OpenSpec changes

## Risks / Trade-offs

- [Two more files per bet reads as ceremony to native-mode users who chose it to avoid exactly that] → mitigated by generating them automatically as a byproduct of the existing `oprim-spec` invocation, not a separate step the user must remember to run, and by dropping `proposal.md` up front rather than waiting to find out it was redundant; kill criteria (per the bet decision) is to scale back to `tasks.md` only if this still feels heavy
- [Soft warning could be ignored, so `tasks.md` never actually gates anything in practice] → acceptable given BET-032's rollback criteria explicitly favor a 2-way door; a future bet can escalate to a hard block once the soft-warning pattern proves out
- [Divergence between `tasks.md` checkbox state and actual shipped code] → out of scope for this bet; same trust model OpenSpec's own `tasks.md` already relies on (self-reported checkbox completion, not CI-verified)
