# Decision: BET-076 Link products and resolve cross-product references through remote context
<!-- Naming tip: verb + object [for context] — e.g. "Improve bet naming for scannability" not "Naming" -->

## Status
- Decision: Build now
- Date: 2026-11-21
- Owner: Eshane Rawat
- Review date: 2026-12-12

## Door type
- [ ] 2-way door (reversible — safe to try, easy to undo)
- [x] 1-way door (hard to reverse — requires higher confidence before committing)

## Risk profile
- **Value risk**: Low — every cross-product feature (objectives, delegation, portfolio view) depends on resolving `<source>:<ID>`; without it the portfolio is a disconnected notebook.
- **Usability risk**: Medium — users must remember to qualify cross-workspace references; an unqualified `BET-012` silently means "local".
- **Feasibility risk**: Medium — git sources resolve through a shallow cache with a 5-minute throttle; resolving many references across many products must stay fast and degrade to stale, not fail, when offline.
- **Business viability risk**: Low — reuses existing `remote_context`; no new external dependency.

## Why now
- `lib/remote-context.ts` already does the hard part (git/local sources, identity check, cache, stale fallback); the registry and reference resolver are a thin, high-leverage layer on top.
- `checkSequenceIntegrity` currently reports any `checkout:BET-012` as a dangling reference — products cannot cite a portfolio artifact today without a false warning.
- It is the 1-way door of the whole initiative (the syntax lands in users' repos), so it should be settled while the surface is still small.

## Alternatives considered
- A separate `products:` registry with its own git/path fields — rejected in PDR-001 (second linking mechanism).
- Markdown links (`[BET-012](../checkout/oprim/...)`) — rejected: path-relative, break for git sources, not machine-resolvable across machines.
- Prefix-only IDs without qualification (`PBET-`) — rejected in PDR-001; qualification works for every artifact type, not only bets.

## Expected outcomes
- A `products:` entry is just `{source, owner, squad, objectives, status}` pointing at an existing `remote_context.sources` name; `doctor` flags an entry whose `source` is not registered.
- `<source>:<BET|PDR|OBJ|NOTE>-NNN` resolves in `blocked_by`, `unlocks`, `requires_pdrs` and bet `## Links`, in both product and portfolio mode, via one `lib/portfolio/refs.ts` resolver.
- `doctor`/`validate` distinguish "source unreachable" (non-required, stale allowed) from "source reachable, artifact missing" (required).
- A product sees which registered source is its portfolio via `mode: portfolio` in the source's `.oprim-context/context.yaml`.

## Kill criteria / rollback trigger
- Resolving all references in a 5-product, ~50-reference portfolio takes > 10s on a warm cache → rethink resolution (batching/index) before shipping the syntax.
- The syntax collides with a real-world value already used in `blocked_by` by an existing workspace → stop and redesign the separator.

## Links
- PDRs: PDR-001
- Objectives: None (objectives land in BET-077)
- OpenSpec change: <to be filled when promoted>
