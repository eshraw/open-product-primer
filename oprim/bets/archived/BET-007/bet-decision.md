# Decision: BET-007 Surface relevant product decisions proactively during agent sessions

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- Users working on bets, discovery, or specs have no way to know which existing PDRs are relevant to what they're doing — decisions are siloed in decisions/ and only surface if the user thinks to look
- The agent has enough context from the conversation to detect relevant topics and query decisions/ proactively

## Alternatives considered
- Dedicated `oprim:context` skill the agent calls before starting work — a pre-flight skill that loads relevant decisions into context at session start
- Semantic search over `decisions/` triggered by topic keywords detected in the conversation — matches live conversation topics to existing PDRs dynamically

## Expected outcomes
- Relevant PDRs surfaced in 100% of oprim skill sessions within 4 weeks (baseline: 0% — manual only)

## Kill criteria / rollback trigger
- PDR surfacing adds noise — more than 50% of surfaced PDRs are irrelevant per session within 30 days — revert to manual linking only

## Links
- PDRs: None
- OpenSpec change: openspec/changes/bet-007-surface-product-decisions-proactively/
