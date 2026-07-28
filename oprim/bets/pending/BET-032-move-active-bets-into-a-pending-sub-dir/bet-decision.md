# Decision: BET-032 Move active bets into a pending sub-dir for build-status visibility
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-07-27
- Owner: Eshane
- Review date: 2026-09-30

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)
- [ ] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Medium — directly resolves the confusion of not knowing which bets are specced-but-not-built vs. shipped, but only matters to teams on the native spec framework, not OpenSpec users
- **Usability risk**: Low — mirrors a familiar todo/doing/done pattern; skills (oprim-bet, oprim-promote, oprim-archive, oprim-spec) handle path resolution so users rarely type the path themselves
- **Feasibility risk**: Low — pure filesystem + skill-instruction change in install-agent.ts, no new dependencies or infra
- **Business viability risk**: Low — purely internal tooling structure, no licensing or ops impact

## Why now
- Native mode's `/oprim:archive` can fold a spec delta into `oprim/specs/` the moment a bet is archived, with no gate confirming the capability was actually implemented
- A flat `oprim/bets/BET-NNN/` next to `oprim/bets/archived/` gives no mid-state signal — the only state distinction lives implicitly in `sequence.yaml` board position, which is deleted entirely on archive
- Fixing this now avoids a migration across many bet dirs once more teams adopt the native framework

## Alternatives considered
- Add a `status:` frontmatter field to `bet-decision.md` instead — rejected: easy to forget to update, no at-a-glance filesystem signal
- Rely on `sequence.yaml` board position (now/next/later/backlog) — rejected: doesn't track implementation state, and the entry is removed on archive
- Wait for BET-028's `validate` command to lint-warn on drift — rejected: a warning detects the symptom after the fact, doesn't fix the missing state signal

## Expected outcomes
- `oprim/bets/pending/` contains only bets not yet folded into current truth
- `oprim/bets/archived/` pairs 1:1 with a corresponding `oprim/specs/<capability>/spec.md`
- `ls oprim/bets/pending/` vs `ls oprim/bets/archived/` gives an instant built-vs-in-flight signal, no file reading required
- `oprim-bet`, `oprim-promote`, `oprim-archive`, `oprim-spec` skills in install-agent.ts updated for the new path

## Kill criteria / rollback trigger
- If the extra directory layer causes more path-resolution bugs than the ambiguity it resolves, revert to flat `oprim/bets/` and pursue a frontmatter status field instead

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-032-bets-pending-subdir/
- Related: BET-028 (sibling concern — CI validation gating, not directory/status semantics)
- Related: BET-033 (blocked by this bet — pending/ split gives BET-033's `tasks.md` a real completion signal)
