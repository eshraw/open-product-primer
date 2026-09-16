# Decision: BET-062 Preview config merge diff before update applies

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — a genuine visibility gap (`config-merge.ts` edits raw text silently), but low severity since changes are additive and git-diffable after the fact
- **Usability risk**: Low — a preview is purely additive to the existing `oprim update` flow
- **Feasibility risk**: High — depends on unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- `config-merge.ts` edits `oprim/config.yaml`'s raw text additively and silently on `oprim update`, with no preview of what keys/blocks are about to be inserted
- A hook could show the diff before the write, giving the user a chance to review or abort

## Alternatives considered
- Status quo: update applies the merge silently; user discovers the change via `git diff` after the fact

## Expected outcomes
- Config merge changes reviewed before write: 0% → 100% (opt-in preview)

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If the preview proves redundant with just checking `git diff` post-update, kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
