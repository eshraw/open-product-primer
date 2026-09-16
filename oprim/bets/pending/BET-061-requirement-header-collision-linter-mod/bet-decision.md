# Decision: BET-061 Lint requirement headers for near-duplicate collisions

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — near-duplicate (not exact) requirement headers can silently coexist since `spec-delta.ts`'s fold logic only matches whitespace-insensitively, raising the odds of an undetected cross-bet conflict (see BET-052)
- **Usability risk**: Medium — fuzzy matching needs tuning so it flags real near-duplicates without nagging on legitimately distinct but similarly-worded requirements
- **Feasibility risk**: High — depends on unverified hooks system; also needs to scan across all of `oprim/specs/`, not just the file being edited
- **Business viability risk**: Low — internal tooling only

## Why now
- Two `### Requirement:` headers that are near-duplicates but not exact matches can co-exist undetected today, since fold/validate logic only does whitespace-insensitive exact matching
- A hook on `spec.md` edits could fuzzy-match new headers against existing ones and warn on near-duplicates

## Alternatives considered
- Status quo: only exact (whitespace-insensitive) header matches are caught by existing fold/validate logic

## Expected outcomes
- Near-duplicate requirement headers flagged: never → at authoring time, before fold/merge

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If the fuzzy-match threshold produces too many false positives, kill or retune

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
