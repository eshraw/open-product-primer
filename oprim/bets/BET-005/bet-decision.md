# Decision: BET-005 Unify oprim, openspec, and grafiphy under a single context folder

## Status
- Decision: Build now
- Date: 2026-05-27
- Owner: Eshane
- Review date: 2026-07-27

## Why now
- Installing oprim, openspec, and grafiphy into a project creates 3+ separate top-level folders, each with their own structure — the project root gets cluttered and there is no single known place to look for agent tooling
- Without a shared root, contributors must know each tool's individual convention to orient themselves

## Alternatives considered
- Unified `context/` top-level folder — oprim/, openspec/, grafiphy/ all live inside it; one known root for all agent tooling (chosen direction)
- `.context/` hidden folder — keeps the project root visually clean, similar to .git or .github
- Keep separate top-level folders, add a manifest file that links them — no structural change, just a registry at root

## Expected outcomes
- Project root has one agent-tooling folder instead of 3+ within 4 weeks (baseline: 3 separate top-level directories)

## Kill criteria / rollback trigger
- One of the tools (openspec, grafiphy) can't support a nested root without major refactor — defer until they can

## Links
- PDRs: None
- OpenSpec change: <to be filled when promoted>
