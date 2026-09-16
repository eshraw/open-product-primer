# Decision: BET-066 Gate bet promotion on discovery-doc completeness

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — extends the existing `criteria.yaml` definition-of-done gate (BET-053) to `discovery.md`, catching a bet promoted with unresolved discovery placeholders still in it
- **Usability risk**: Medium — only applies when `discovery.md` was scaffolded in the first place (optional per BET-bet skill step 7); must not fire on bets that never scaffolded one
- **Feasibility risk**: High — depends on unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` hooks system (anthropics/claude-code#91870); also needs a reliable placeholder-detection pattern against `templates/discovery.md`
- **Business viability risk**: Low — internal tooling only

## Why now
- BET-053 proposes gating `/oprim:promote` on `criteria.yaml` existing, but a scaffolded `discovery.md` can itself still be left with unresolved placeholder sections at promote time, with nothing checking it
- Reuses the same promote-time hook point as BET-053; the two could ship together

## Alternatives considered
- Status quo: no completeness check on `discovery.md`; a half-filled discovery doc can promote to an OpenSpec change unnoticed
- Extend `checkBetDefinitionOfDone()` in `lib/validate-checks.ts` as a batch `oprim validate` check instead of a live hook — same detection, but only catches it after promotion rather than blocking it

## Expected outcomes
- Bets promoted with unresolved `discovery.md` placeholders: unchecked → blocked/flagged at promote time (only for bets that scaffolded a discovery doc)

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill and consider the `oprim validate` batch-check alternative instead
- If placeholder detection produces false positives on legitimately terse (but complete) discovery docs, kill or retune

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
