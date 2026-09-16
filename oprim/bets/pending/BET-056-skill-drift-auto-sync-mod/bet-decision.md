# Decision: BET-056 Auto-sync skill version drift via mod

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — saves a manual `oprim doctor` → `oprim update` round trip; convenience, not a new capability
- **Usability risk**: Low — offering an inline update is a natural extension of what `doctor` already reports
- **Feasibility risk**: High — depends on unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- `oprim doctor` already flags installed `.claude/skills/` content diverging from the CLI-bundled `workflow-renderer.ts` output, but resolving it still requires a separate manual `oprim update`
- A mod could offer to run `oprim update` inline the moment drift is detected

## Alternatives considered
- Status quo: doctor flags drift, user manually runs `oprim update` later

## Expected outcomes
- Time from skill drift introduced to resolved: next `doctor` run + manual update → inline offer at detection time

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
