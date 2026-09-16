# Decision: BET-060 Pre-fill bet draft from note during promotion

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — cuts real re-typing work at promote time, but only for notes that already capture enough structure to auto-fill from
- **Usability risk**: Low — pre-filled fields are still editable, not forced
- **Feasibility risk**: High — depends on unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` hooks system (anthropics/claude-code#91870); also needs reliable extraction from free-form note content
- **Business viability risk**: Low — internal tooling only

## Why now
- `/oprim:promote` (note→bet path) currently starts `bet-decision.md` blank; a note's tiered frontmatter and body often already contain what step 4's Q&A asks for (why-now, alternatives, links)
- A hook could pre-fill the draft from note content, leaving the user to confirm/edit rather than re-type

## Alternatives considered
- Status quo: promote creates a blank `bet-decision.md`, user re-enters everything the note already captured

## Expected outcomes
- Fields pre-filled from note content at promote time: 0 → most of Why now / Alternatives / Links

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If note structure varies too much for reliable auto-fill, kill or rescope to a subset of fields

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
