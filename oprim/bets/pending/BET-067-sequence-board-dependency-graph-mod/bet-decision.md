# Decision: BET-067 Render sequence board as a dependency graph

## Status
- Decision: Defer
- Date: 2026-09-16
- Owner: Eshane Rawat
- Review date: 2026-10-16

## Door type
- [x] 2-way door (reversible — safe to try, easy to undo)

## Risk profile
- **Value risk**: Medium — `sequence.yaml`'s `blocked_by`/`unlocks` edges are inherently graph-shaped, but today only exposed as text/YAML or `oprim ovw`'s prose summary
- **Usability risk**: Low — additive rendering, doesn't change the underlying board data or existing `ovw` output
- **Feasibility risk**: Low-Medium — buildable today as an on-demand skill/script (any graph format: Mermaid, DOT, plain tree) with no dependency on the unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` system; a hook would only be needed for auto-refresh-on-write, which is optional scope
- **Business viability risk**: Low — internal tooling only

## Why now
- The board's `blocked_by`/`unlocks` relationships are currently only readable by parsing YAML by eye; a graph rendering would make dependency chains visible at a glance
- Doesn't require the mods/hooks system to deliver value — can ship as a plain on-demand command first, with live-refresh-on-write as optional later scope

## Alternatives considered
- Status quo: read `sequence.yaml` directly, or via `oprim ovw`'s text summary
- Mermaid-specific rendering vs. a generic graph format (DOT/D3/ASCII tree) — left open; format is an implementation detail, not core to the bet

## Expected outcomes
- Time to understand board dependencies: manual YAML parsing → rendered graph, on demand

## Kill criteria / rollback trigger
- If a generated graph provides no more clarity than existing `oprim ovw` text output for typical board sizes, kill

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
