# Decision: BET-069 Visualize session changes as a blast-radius graph

## Status
- Decision: Build now
- Date: 2026-09-22
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — nothing today shows "these files changed this session, here's everything that references or is referenced by them"; closest existing checks (BET-052, BET-061) are narrow, text-only warnings
- **Usability risk**: Medium — cross-reference resolution needs to be reliable enough that the graph isn't misleading; scoping to known link types (`BET-NNN`, `PDR-NNN`, requirement headers) keeps it tractable
- **Feasibility risk**: Low-Medium — buildable as an on-demand script over `git diff` + link resolution, no dependency on the unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- Session changes and their downstream/upstream links (which bet's delta touches a capability, which criteria maps to it, which PDRs are linked) are currently only traceable by manual grep

## Alternatives considered
- Status quo: `git diff` plus manual grep for cross-references
- A flat "files changed + files that reference them" text list instead of a graph — simpler, loses shape for changes with many link hops

## Expected outcomes
- Blast radius of a session's changes visualized on demand instead of manually traced

## Kill criteria / rollback trigger
- If cross-reference resolution proves unreliable or noisy (false links), making the graph misleading, kill or narrow scope to known link types only

## Links
- PDRs: None
- OpenSpec change: N/A (native spec framework)
- Spec (delta): oprim/bets/pending/BET-069-session-blast-radius-graph-mod/specs/session-blast-radius-graph/spec.md
