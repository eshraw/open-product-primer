# Design: session-blast-radius-graph

## Approach
An on-demand script/skill runs `git diff` (against a base ref, defaulting to the last commit or a user-specified range) to get the session's changed files, then resolves cross-references from those files using known link types only — `BET-NNN`, `PDR-NNN`, and `### Requirement:` headers — rather than free-form text matching. It renders the changed files plus everything they reference or are referenced by as a blast-radius graph.

Scoping resolution to known link types (per the bet's usability-risk note) keeps the graph trustworthy: an unreliable/noisy cross-reference resolver would make the graph misleading, which is the bet's own kill criterion.

## Key decisions
- **Input: `git diff`**, not a live hook — matches the bet's feasibility framing (no dependency on unverified `CLAUDE_CODE_ENABLE_FUNCTION_HOOKS`).
- **Link resolution scoped to known patterns**: `BET-NNN`, `PDR-NNN`, `### Requirement:` headers. No generic grep/heuristic matching, to avoid false links.
- **Format: Mermaid**, consistent with the other graph-mod bets ([[sequence-map]], [[bet-lineage-dependency-graph]]).

## Alternatives considered
- Flat "files changed + files that reference them" text list — rejected per the bet: simpler, but loses shape for changes with many link hops.

## Risks
- If cross-reference resolution proves unreliable or noisy in practice, the bet's kill criterion applies — narrow scope to known link types only (already the default here) or kill.
