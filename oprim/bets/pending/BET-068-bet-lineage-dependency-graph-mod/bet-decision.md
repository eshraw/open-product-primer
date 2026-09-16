# Decision: BET-068 Visualize bet lineage as a dependency graph

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — PDR → bet → criteria.yaml → spec delta → OpenSpec change → archive is a real chain (CLAUDE.md's authority-boundary split), but today only traceable by manually following file links
- **Usability risk**: Low — additive, read-only visualization over existing link fields
- **Feasibility risk**: Low-Medium — buildable as an on-demand skill/script that walks existing link fields (`Links: PDRs:`, `OpenSpec change:`), no dependency on the unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- The lineage chain oprim already models (PDR/bet/criteria/spec-delta/archive) is currently only navigable by opening files one at a time and following text links

## Alternatives considered
- Status quo: manual link-following across files
- A text-only lineage report instead of a graph — simpler, but loses the at-a-glance shape a graph gives for bets with multiple PDR links or spec deltas

## Expected outcomes
- Lineage chain visualized end-to-end per bet, instead of requiring manual link traversal across 4-5 files

## Kill criteria / rollback trigger
- If most bets have too sparse a lineage (no PDR, no criteria) for a graph to add value over a simple list, kill or rescope to a text report

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
