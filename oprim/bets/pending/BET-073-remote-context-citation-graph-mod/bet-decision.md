# Decision: BET-073 Visualize remote-context citations as a graph

## Status
- Decision: Build now
- Date: 2026-09-22
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Low-Medium — `remote_context` sources (`lib/remote-context.ts`) already model citing/cited relationships between projects, but there's no visualization of the citation network, only per-source resolution
- **Usability risk**: Low — additive, read-only visualization
- **Feasibility risk**: Low-Medium — buildable as an on-demand render over existing `lib/remote-context.ts` resolution (`oprim context list`'s data), no dependency on the unverified hooks system
- **Business viability risk**: Low — internal tooling only

## Why now
- The citation relationships oprim already resolves (who registers whom as a remote context source) are currently only inspectable one source at a time via `oprim context`/`oprim context list`

## Alternatives considered
- Status quo: `oprim context list` per-project text output, inspected one source at a time

## Expected outcomes
- Citation network visualized across all registered sources instead of inspected one at a time

## Kill criteria / rollback trigger
- If most projects register 0-1 sources (too sparse a network to visualize meaningfully), kill as low-value until remote-context adoption grows

## Links
- PDRs: None
- OpenSpec change: N/A (native spec framework)
- Spec (delta): oprim/bets/pending/BET-073-remote-context-citation-graph-mod/specs/remote-context-citation-graph/spec.md
