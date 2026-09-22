# Design: sequence-map

## Approach
An on-demand command/skill reads `oprim/sequence.yaml` and renders its `blocked_by`/`unlocks` edges as a dependency graph, rather than requiring manual YAML reading. Output defaults to Mermaid (`graph TD`) since it renders inline in most Markdown viewers (GitHub, editors) without extra tooling; the bet leaves the exact format open, so a DOT or plain-text tree fallback stays a follow-on, not a blocker for this pass.

No hook or live-refresh dependency: this is a read/render step, invoked the same way `oprim ovw` is invoked today, over the same `sequence.yaml` data `oprim doctor`'s integrity check already parses.

## Key decisions
- **Format: Mermaid by default.** Widely renderable, no new dependency. DOT/ASCII stays optional future scope per the bet's "Alternatives considered."
- **Data source: `sequence.yaml` only.** No new fields required — `blocked_by`/`unlocks`/`now`/`backlog`/`done` already model the graph shape.
- **On-demand, not live.** Matches the bet's feasibility framing: auto-refresh-on-write would need the unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS` hook system, explicitly scoped out as optional later work.

## Alternatives considered
- Live-updating graph via a write hook — rejected for this pass (unverified hooks dependency); status quo is `oprim ovw`'s text summary or reading `sequence.yaml` directly.

## Risks
- If a rendered graph doesn't add clarity over `oprim ovw`'s existing text output for typical board sizes, the bet's kill criterion applies.
