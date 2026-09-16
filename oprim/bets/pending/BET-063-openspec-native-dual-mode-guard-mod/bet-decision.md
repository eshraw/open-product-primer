# Decision: BET-063 Warn on OpenSpec and native spec dual-mode drift

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — oprim supports both `openspec/changes/` and native `oprim/specs/<capability>/spec.md` (CLAUDE.md's authority-boundaries split), but nothing today warns if a project drifts between both for the same capability
- **Usability risk**: Medium — needs a reliable way to detect "same capability" across two different directory conventions without false-flagging projects that legitimately use both for different capabilities
- **Feasibility risk**: High — depends on unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- Nothing currently detects concurrent activity in both `openspec/changes/` and native `oprim/specs/` trees for the same capability name
- A hook could flag that ambiguity at write time instead of it surfacing later as confusion about which framework is authoritative

## Alternatives considered
- Status quo: no cross-framework drift detection; relies on the team already knowing which framework is authoritative

## Expected outcomes
- Dual-mode drift (same capability edited under both frameworks) surfaced: never → at write time

## Kill criteria / rollback trigger
- If the hooks system doesn't materialize by review date, kill
- If false positives are common for projects that legitimately use both frameworks for different capabilities, kill or rescope matching logic

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
